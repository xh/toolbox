import type {
    PivotColumnGroupContext,
    PivotColumnGroupSpec,
    PivotColumnSizingOptions,
    PivotSort
} from '@xh/hoist/cmp/cubegrid';
import {CubeGridModel} from '@xh/hoist/cmp/cubegrid';
import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import type {ColumnSpec} from '@xh/hoist/cmp/grid';
import type {HSide, PlainObject, VSide} from '@xh/hoist/core';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import type {CubeFieldSpec, View} from '@xh/hoist/data';
import {Cube} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {bindable, bindableRef, observable, observableRef, runInAction} from '@xh/hoist/mobx';
import {isEmpty, map, startCase, uniq} from 'lodash';
import {generateLeaves, getProfile, tickLeaves} from './CubeGridBenchData';

/** `experimental.maxPatchRatio` applied when record patching is toggled on. */
const PATCH_RATIO = 0.1;

/** Per-level pivot sort, as the toolbar offers it. `custom` is an explicit value order. */
export type SortChoice = 'view' | 'asc' | 'desc' | 'custom';

/** Column filter target - the view re-aggregates, the store filters the group rows as they are. */
export type FilterChoice = 'off' | 'view' | 'store';

/** Explicit orderings for `custom` - a value or two pulled to the front, the rest in view order. */
const CUSTOM_ORDERS: Record<string, string[]> = {
    regionCore: ['Other', 'EMEA'],
    assetClass: ['Cash', 'FX']
};

/**
 * A live `CubeGrid` with its whole config surface driven from toolbars - the panel to reach for when
 * a question is "what does this look like", rather than "is this correct".
 *
 * Grouping and pivot dimensions come from disjoint pools, since a pivot rejects a field used as
 * both. The model is built from `cube` + `query` and owns its view, so everything on the query side
 * goes through `view.updateQuery()` - `CubeGridModel` holds no query config of its own. Presentation
 * options are held here, passed as config on a rebuild and pushed onto the live model as they change.
 */
export class CubeGridTestModel extends HoistModel {
    static GROUP_DIMS = ['fund', 'strategy', 'sector'];
    static PIVOT_DIMS = ['regionCore', 'assetClass'];
    static VALUE_FIELDS = ['pnl', 'mktVal', 'quantity'];

    //------------------------
    // Query
    //------------------------
    @bindableRef accessor groupBy: string[] = ['fund', 'strategy'];
    @bindableRef accessor pivotBy: string[] = ['regionCore', 'assetClass'];
    @bindableRef accessor valueFields: string[] = ['pnl'];
    @bindable accessor includeRoot = true;
    @bindable accessor includeLeaves = false;
    @bindable accessor omitRedundantNodes = false;
    @bindable accessor excludeEmptyPivotValues = false;
    @bindable accessor emptyPathLabel = '(empty)';
    /** Null for unlimited. */
    @bindable accessor maxPivotPaths: number = 100;

    //------------------------
    // Presentation
    //------------------------
    @bindable accessor showPivotSummaries: boolean | HSide = 'left';
    @bindable accessor showSummary: boolean | VSide = false;
    @bindable accessor pivotGroupsCollapsible = true;
    @bindable accessor pivotCollapsedTotalHeader = true;
    /** Off sizes each pivot column on its own, as in any grid. */
    @bindable accessor uniformPivotWidths = true;
    /** Most a pivot group label can claim. 0 or blank sizes for data alone. */
    @bindable accessor headerFitMaxWidth: number = 140;
    /** Lengthens the leaf pivot labels, to see them fitted and truncated. */
    @bindable accessor longPivotLabels = false;
    /** Initial level on a rebuild, and pushed via `pivotModel.expandToLevel` when changed. */
    @bindable accessor pivotExpandLevel = -1;
    @bindable accessor sortLevel0: SortChoice = 'view';
    @bindable accessor sortLevel1: SortChoice = 'view';
    /** Fixed on the GridModel, so a change rebuilds. */
    @bindable accessor columnFilters: FilterChoice = 'view';

    //------------------------
    // Data
    //------------------------
    @bindable accessor leafCount = 5000;

    /** Fixed at Store construction, so flipping it rebuilds the Cube and everything downstream. */
    @bindable accessor patchRecordSets = false;

    @observableRef accessor status = '';
    @observable accessor rebuilding = false;

    @managed private cube: Cube;
    // Observable so the panel re-renders and the status reaction re-tracks on a rebuild.
    @managed @observableRef accessor cubeGridModel: CubeGridModel;
    /** Bound to the view, so it filters the facts and re-aggregates - reaches the pivot dims. */
    @managed @observableRef accessor filterChooserModel: FilterChooserModel;

    get view(): View {
        return this.cubeGridModel?.view;
    }

    private leaves: PlainObject[] = [];
    private tickGen = 0;

    constructor() {
        super();

        this.addReaction(
            {
                track: () => [this.leafCount, this.patchRecordSets, this.columnFilters],
                equals: 'shallow',
                run: () => this.rebuildAsync(),
                fireImmediately: true
            },
            {
                track: () => [
                    this.groupBy,
                    this.pivotBy,
                    this.valueFields,
                    this.includeRoot,
                    this.includeLeaves,
                    this.omitRedundantNodes,
                    this.excludeEmptyPivotValues,
                    this.emptyPathLabel,
                    this.maxPivotPaths
                ],
                equals: 'shallow',
                run: () => this.updateQuery()
            },
            {
                track: () => [
                    this.showPivotSummaries,
                    this.showSummary,
                    this.pivotGroupsCollapsible,
                    this.pivotCollapsedTotalHeader
                ],
                equals: 'shallow',
                run: () => {
                    const {cubeGridModel} = this;
                    if (!cubeGridModel) return;
                    const {pivotModel} = cubeGridModel;
                    pivotModel.showSummaries = this.showPivotSummaries;
                    cubeGridModel.setShowSummary(this.showSummary);
                    pivotModel.groupsCollapsible = this.pivotGroupsCollapsible;
                    pivotModel.collapsedTotalHeader = this.pivotCollapsedTotalHeader;
                }
            },
            {
                track: () => this.pivotColumnSizing,
                equals: 'structural',
                run: sizing => {
                    if (this.cubeGridModel) this.cubeGridModel.pivotModel.columnSizing = sizing;
                }
            },
            {
                track: () => this.longPivotLabels,
                run: () => {
                    if (this.cubeGridModel) {
                        this.cubeGridModel.pivotModel.columnGroupSpecFn =
                            this.pivotColumnGroupSpecFn;
                    }
                }
            },
            {
                track: () => this.pivotExpandLevel,
                run: level => this.cubeGridModel?.pivotModel.expandToLevel(level)
            },
            {
                track: () => this.pivotSortBy,
                run: sortBy => {
                    if (this.cubeGridModel) this.cubeGridModel.pivotModel.sortBy = sortBy;
                }
            },
            // Columns rebuild in their own reaction, so anything reading them right after a query
            // change reads the outgoing set.
            {
                track: () => [this.view?.result, this.cubeGridModel?.gridModel.columns],
                equals: 'shallow',
                run: () => this.noteStatus()
            }
        );
    }

    /** Reload the Cube and mint a fresh view and grid - a leaf-count change is a new dataset. */
    async rebuildAsync() {
        const {columnFilters} = this;
        // Clear the observable ref *before* destroying: the panel renders `cubeGridModel` and the
        // status reaction reads it, so a destroyed model left in place is rendered across the
        // `await` below.
        runInAction(() => {
            this.rebuilding = true;
            const prior = [this.filterChooserModel, this.cubeGridModel, this.cube];
            this.filterChooserModel = null;
            this.cubeGridModel = null;
            this.cube = null;
            XH.safeDestroy(prior);
        });
        try {
            this.leaves = generateLeaves({...getProfile('heavy'), leaves: this.leafCount});
            this.cube = new Cube({
                fields: this.cubeFields(),
                idSpec: 'id',
                store: {experimental: {maxPatchRatio: this.patchRecordSets ? PATCH_RATIO : 0}}
            });
            await this.cube.loadDataAsync(this.leaves);

            const cubeGridModel = new CubeGridModel({
                cube: this.cube,
                query: this.queryConfig(),
                columns: FIXED_COLUMNS,
                gridConfig: {
                    persistWith: {localStorageKey: 'cubeGridTest'},
                    showSummary: this.showSummary,
                    sizingMode: 'compact',
                    colChooserModel: true,
                    colDefaults: {filterable: true},
                    filterModel: columnFilters === 'off' ? false : {bind: columnFilters},
                    autosizeOptions: {mode: 'managed', includeHiddenColumns: false}
                },
                pivotConfig: {
                    columns: map(VALUE_SPECS, (spec, field) => ({field, ...spec})),
                    sortBy: this.pivotSortBy,
                    showSummaries: this.showPivotSummaries,
                    groupsCollapsible: this.pivotGroupsCollapsible,
                    collapsedTotalHeader: this.pivotCollapsedTotalHeader,
                    columnSizing: this.pivotColumnSizing,
                    columnGroupSpecFn: this.pivotColumnGroupSpecFn,
                    expandLevel: this.pivotExpandLevel
                }
            });
            const filterChooserModel = new FilterChooserModel({bind: cubeGridModel.view});
            runInAction(() => {
                this.cubeGridModel = cubeGridModel;
                this.filterChooserModel = filterChooserModel;
            });
        } finally {
            runInAction(() => (this.rebuilding = false));
        }
    }

    /** Values-only: no dimension moves, so the column structure must hold. */
    async tickAsync() {
        tickLeaves(this.leaves, Math.max(1, Math.round(this.leaves.length * 0.02)), ++this.tickGen);
        await this.cube.updateDataAsync(this.leaves);
    }

    /** Structural: a brand-new pivot value has to mint cell fields and columns for itself. */
    async addPivotValueAsync() {
        const dim = this.pivotBy.at(-1);
        if (!dim) return;

        this.leaves.forEach((rec, i) => {
            if (i % 17 === 0) rec[dim] = 'ZZ-New';
        });
        await this.cube.updateDataAsync(this.leaves);
    }

    /** Blank a slice of the outermost pivot dimension, to see the `(empty)` path segment rendered. */
    async blankPivotValuesAsync() {
        const dim = this.pivotBy[0];
        if (!dim) return;

        this.leaves.forEach((rec, i) => {
            if (i % 11 === 0) rec[dim] = i % 22 === 0 ? null : '';
        });
        await this.cube.updateDataAsync(this.leaves);
    }

    //------------------------
    // Implementation
    //------------------------

    private get pivotColumnSizing(): boolean | PivotColumnSizingOptions {
        return this.uniformPivotWidths && {headerFitMaxWidth: this.headerFitMaxWidth ?? 0};
    }

    private get pivotColumnGroupSpecFn(): (ctx: PivotColumnGroupContext) => PivotColumnGroupSpec {
        if (!this.longPivotLabels) return null;
        return ({path, kind}) =>
            kind === 'path' && isEmpty(path.children)
                ? {headerName: `${path.label} Strategies Group`}
                : null;
    }

    private get pivotSortBy(): PivotSort[] {
        return [this.sortLevel0, this.sortLevel1].map((choice, level) =>
            toPivotSort(choice, this.pivotBy[level])
        );
    }

    private updateQuery() {
        // A pivot rejects an empty `valueFields`, and the toolbar can transiently produce one.
        if (isEmpty(this.valueFields) || !this.view) return;
        this.view.updateQuery(this.queryConfig());
    }

    private queryConfig() {
        const {groupBy, pivotBy, valueFields, includeRoot, includeLeaves, omitRedundantNodes} =
            this;
        return {
            dimensions: groupBy,
            includeRoot,
            includeLeaves,
            omitRedundantNodes,
            pivot: {
                dimensions: pivotBy,
                valueFields,
                excludeEmptyPivotValues: this.excludeEmptyPivotValues,
                emptyPathLabel: this.emptyPathLabel,
                maxPivotPaths: this.maxPivotPaths
            }
        };
    }

    private cubeFields(): CubeFieldSpec[] {
        const dims = uniq([...CubeGridTestModel.GROUP_DIMS, ...CubeGridTestModel.PIVOT_DIMS]);
        return [
            ...dims.map(name => ({name, type: 'string' as const, isDimension: true})),
            ...CubeGridTestModel.VALUE_FIELDS.map(name => ({
                name,
                type: 'number' as const,
                aggregator: 'SUM' as const
            }))
        ];
    }

    private noteStatus() {
        if (!this.view || !this.cubeGridModel) return;
        const {result} = this.view,
            {store, gridModel} = this.cubeGridModel;

        runInAction(() => {
            this.status =
                `${store.allCount.toLocaleString()} rows · ${result.paths.length} top-level paths · ` +
                `${result.cellFields.length} cell fields · ${gridModel.getLeafColumns().length} columns`;
        });
    }
}

const VALUE_SPECS: Record<string, ColumnSpec> = {
    pnl: {width: 110, absSort: true, renderer: numberRenderer({precision: 0, colorSpec: true})},
    mktVal: {width: 120, renderer: numberRenderer({precision: 0})},
    quantity: {width: 100, renderer: numberRenderer({precision: 0})}
};

/**
 * Fixed columns, hidden until added through the column chooser - the only region the chooser
 * manages. A measure's bare name is its row total, whether or not the query pivots it. The group
 * dimensions are here to reach a column filter on them.
 */
const FIXED_COLUMNS: ColumnSpec[] = [
    {field: 'cubeDimension', headerName: 'Dimension', width: 100},
    ...CubeGridTestModel.GROUP_DIMS.map(field => ({
        field,
        headerName: startCase(field),
        width: 100
    })),
    {field: 'pnl', headerName: 'Total P&L', ...VALUE_SPECS.pnl},
    {field: 'mktVal', headerName: 'Total Mkt Val', ...VALUE_SPECS.mktVal},
    {field: 'quantity', headerName: 'Total Qty', ...VALUE_SPECS.quantity}
].map(it => ({...it, chooserName: it.headerName as string, hidden: true}));

export const FILTER_OPTIONS: Array<{value: FilterChoice; label: string}> = [
    {value: 'off', label: 'Off'},
    {value: 'view', label: 'View'},
    {value: 'store', label: 'Store'}
];

function toPivotSort(choice: SortChoice, dim: string): PivotSort {
    switch (choice) {
        case 'asc':
        case 'desc':
            return choice;
        case 'custom':
            return CUSTOM_ORDERS[dim] ?? [];
        default:
            return null;
    }
}

export const SUMMARY_H_OPTIONS: Array<{value: boolean | HSide; label: string}> = [
    {value: false, label: 'Off'},
    {value: true, label: 'On (default side)'},
    {value: 'left', label: 'Left'},
    {value: 'right', label: 'Right'}
];

export const SUMMARY_V_OPTIONS: Array<{value: boolean | VSide; label: string}> = [
    {value: false, label: 'Off'},
    {value: 'top', label: 'Top'},
    {value: 'bottom', label: 'Bottom'}
];

export const SORT_OPTIONS: Array<{value: SortChoice; label: string}> = [
    {value: 'view', label: 'View order'},
    {value: 'asc', label: 'Asc'},
    {value: 'desc', label: 'Desc'},
    {value: 'custom', label: 'Custom list'}
];

export const EXPAND_LEVEL_OPTIONS = [
    {value: -1, label: 'All'},
    {value: 0, label: '0 - region collapsed'},
    {value: 1, label: '1 - top groups'},
    {value: 2, label: '2'}
];
