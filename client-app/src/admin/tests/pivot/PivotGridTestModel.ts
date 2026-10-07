import type {PivotSort} from '@xh/hoist/cmp/pivotgrid';
import {PivotGridModel} from '@xh/hoist/cmp/pivotgrid';
import type {HSide, PlainObject, VSide} from '@xh/hoist/core';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import type {CubeFieldSpec, PivotView} from '@xh/hoist/data';
import {Cube} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {bindable, bindableRef, observable, observableRef, runInAction} from '@xh/hoist/mobx';
import {isEmpty, uniq} from 'lodash';
import {generateLeaves, getProfile, tickLeaves} from './PivotBenchData';

/** `experimental.maxPatchRatio` applied when record patching is toggled on. */
const PATCH_RATIO = 0.1;

/**
 * A live `PivotGrid` with its whole config surface driven from a toolbar - the panel to reach for when
 * a question is "what does this look like", rather than "is this correct".
 *
 * Grouping and pivot dimensions come from disjoint pools, since `PivotQuery` rejects a field used as
 * both. Everything on the query side goes through `view.updateQuery()`, which is the only way an app
 * reconfigures a pivot grid - `PivotGridModel` holds no query config and is bound to its view for life.
 */
export class PivotGridTestModel extends HoistModel {
    static GROUP_DIMS = ['fund', 'strategy', 'sector'];
    static PIVOT_DIMS = ['regionCore', 'assetClass'];
    static VALUE_FIELDS = ['pnl', 'mktVal', 'quantity'];

    @bindableRef accessor groupBy: string[] = ['fund', 'strategy'];
    @bindableRef accessor pivotBy: string[] = ['regionCore', 'assetClass'];
    @bindableRef accessor valueFields: string[] = ['pnl'];
    @bindable accessor includeRoot = true;
    @bindable accessor includeLeaves = false;
    @bindable accessor excludeEmptyPivotValues = false;
    @bindable accessor leafCount = 5000;

    /** Fixed at Store construction, so flipping it rebuilds the Cube and everything downstream. */
    @bindable accessor patchRecordSets = false;

    /** Applied to the outermost pivot dimension only - enough to see it work. */
    @bindable accessor pivotSort: PivotSort = null;

    @observableRef accessor status = '';
    @observable accessor rebuilding = false;

    @managed private cube: Cube;
    // Observable so the panel re-renders and the status reaction re-tracks on a rebuild.
    @managed @observableRef accessor view: PivotView;
    @managed @observableRef accessor pivotGridModel: PivotGridModel;

    private leaves: PlainObject[] = [];
    private tickGen = 0;

    constructor() {
        super();

        this.addReaction(
            {
                track: () => [this.leafCount, this.patchRecordSets],
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
                    this.excludeEmptyPivotValues
                ],
                equals: 'shallow',
                run: () => this.updateQuery()
            },
            {
                track: () => this.pivotSort,
                run: sort => {
                    if (this.pivotGridModel) {
                        this.pivotGridModel.pivotSortBy = sort ? [sort] : [];
                    }
                }
            },
            // Columns rebuild in their own reaction, so anything reading them right after a query
            // change reads the outgoing set.
            {
                track: () => [this.view?.result, this.pivotGridModel?.gridModel.columns],
                equals: 'shallow',
                run: () => this.noteStatus()
            }
        );
    }

    /** Reload the Cube and mint a fresh view and grid - a leaf-count change is a new dataset. */
    async rebuildAsync() {
        // Clear the observable refs *before* destroying, and in one action: the panel renders
        // `pivotGridModel` and the status reaction reads both, so a destroyed model left in place is
        // rendered across the `await` below, and an unbatched reassignment is seen half-done.
        runInAction(() => {
            this.rebuilding = true;
            const prior = [this.pivotGridModel, this.view, this.cube];
            this.pivotGridModel = null;
            this.view = null;
            this.cube = null;
            XH.safeDestroy(prior);
        });
        try {
            this.leaves = generateLeaves({...getProfile('heavy'), leaves: this.leafCount} as any);
            this.cube = new Cube({
                fields: this.cubeFields(),
                idSpec: 'id',
                store: {experimental: {maxPatchRatio: this.patchRecordSets ? PATCH_RATIO : 0}}
            });
            await this.cube.loadDataAsync(this.leaves);

            const view = this.cube.createPivotView({query: this.queryConfig(), connect: true}),
                pivotGridModel = new PivotGridModel({
                    view,
                    rowSummary: 'right',
                    valueSummary: 'top',
                    valueColumnSpecs: {
                        pnl: {
                            width: 110,
                            renderer: numberRenderer({precision: 0, colorSpec: true})
                        },
                        mktVal: {width: 120, renderer: numberRenderer({precision: 0})},
                        quantity: {width: 100, renderer: numberRenderer({precision: 0})}
                    },
                    gridConfig: {
                        sizingMode: 'compact',
                        autosizeOptions: {mode: 'managed', includeHiddenColumns: false}
                    }
                });
            if (this.pivotSort) pivotGridModel.pivotSortBy = [this.pivotSort];

            runInAction(() => {
                this.view = view;
                this.pivotGridModel = pivotGridModel;
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

    private updateQuery() {
        // PivotQuery rejects an empty `valueFields`, and the toolbar can transiently produce one.
        if (isEmpty(this.valueFields)) return;
        this.view.updateQuery(this.queryConfig());
    }

    private queryConfig() {
        const {groupBy, pivotBy, valueFields, includeRoot, includeLeaves} = this;
        return {
            dimensions: groupBy,
            fields: this.cubeFields().map(it => it.name),
            pivotDimensions: pivotBy,
            valueFields,
            includeRoot,
            includeLeaves,
            excludeEmptyPivotValues: this.excludeEmptyPivotValues,
            omitRedundantNodes: false,
            maxPivotPaths: null
        };
    }

    private cubeFields(): CubeFieldSpec[] {
        const dims = uniq([...PivotGridTestModel.GROUP_DIMS, ...PivotGridTestModel.PIVOT_DIMS]);
        return [
            ...dims.map(name => ({name, type: 'string' as const, isDimension: true})),
            ...PivotGridTestModel.VALUE_FIELDS.map(name => ({
                name,
                type: 'number' as const,
                aggregator: 'SUM' as const
            }))
        ];
    }

    private noteStatus() {
        if (!this.view || !this.pivotGridModel) return;
        const {result} = this.view,
            {store, gridModel} = this.pivotGridModel;

        runInAction(() => {
            this.status =
                `${store.allCount.toLocaleString()} rows · ${result.paths.length} top-level paths · ` +
                `${result.cellFields.length} cell fields · ${gridModel.getLeafColumns().length} columns`;
        });
    }
}

export const SUMMARY_H_OPTIONS: Array<{value: boolean | HSide; label: string}> = [
    {value: false, label: 'Off'},
    {value: 'left', label: 'Left'},
    {value: 'right', label: 'Right'}
];

export const SUMMARY_V_OPTIONS: Array<{value: boolean | VSide; label: string}> = [
    {value: false, label: 'Off'},
    {value: 'top', label: 'Top'},
    {value: 'bottom', label: 'Bottom'}
];
