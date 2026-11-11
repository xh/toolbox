import {filler, span} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import type {PivotDimensionSpec} from '@xh/hoist/cmp/cubegrid';
import {cubeGrid, CubeGridModel} from '@xh/hoist/cmp/cubegrid';
import type {HSide, LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import type {QueryConfig} from '@xh/hoist/data';
import {Cube} from '@xh/hoist/data';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {gridFindField} from '@xh/hoist/desktop/cmp/grid';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, bindableRef} from '@xh/hoist/mobx';
import {takeRight} from 'lodash';
import {wrapper, wrapperOption} from '../../common/Wrapper';

export const cubeGridPanel = hoistCmp.factory({
    model: creates(() => CubeGridPanelModel),
    render({model}) {
        const {cubeGridModel} = model;
        return wrapper({
            title: 'Cube Grid',
            icon: Icon.gridPanel(),
            description: [
                '`CubeGrid` shows a `Cube` `View` as a tree grid, one row level per query',
                'dimension. Give its model a cube and a query; it owns the view, store and grid.',
                '',
                'Set `pivot` on the query to spread measures across a second set of dimensions,',
                'each value becoming a column group. Reconfigure with `view.updateQuery()`.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/CubeGridPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/cubegrid/CubeGrid.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/cubegrid/CubeGridModel.ts',
                    notes: 'Fixed columns and pivot display settings.'
                },
                {url: '$HR/cmp/cubegrid/README.md', notes: 'CubeGrid README.'},
                {
                    url: '$HR/data/cube/Query.ts',
                    notes: 'Query spec, including the pivot.'
                }
            ],
            options: [
                wrapperOption({
                    label: 'Show pivot summaries',
                    propName: 'PivotDimensionSpec.showSummary',
                    control: select({
                        bind: 'pivotShowSummaries',
                        options: H_SIDE_OPTIONS,
                        enableFilter: false,
                        width: 110
                    }),
                    info: 'Where each pivot group shows its summary while expanded.'
                }),
                wrapperOption({
                    label: 'Pivot groups collapsible',
                    propName: 'PivotDimensionSpec.collapsible',
                    control: switchInput({bind: 'pivotCollapsible'}),
                    info: 'Let pivot groups collapse to their summaries.'
                }),
                wrapperOption({
                    label: 'Measures outermost',
                    propName: 'CubeGridPivotConfig.measuresOutermost',
                    control: switchInput({
                        model: cubeGridModel.pivotModel,
                        bind: 'measuresOutermost'
                    }),
                    info: 'With two or more measures, group columns by measure, then pivot value.'
                }),
                wrapperOption({
                    label: 'Show root group',
                    propName: 'CubeGridPivotConfig.showRootGroup',
                    control: switchInput({model: cubeGridModel.pivotModel, bind: 'showRootGroup'}),
                    info: 'Head the pivot columns with a group that collapses to the row summary.'
                }),
                wrapperOption({
                    label: 'Linked sizing',
                    propName: 'CubeGridPivotConfig.linkedSizing',
                    control: switchInput({model: cubeGridModel.pivotModel, bind: 'linkedSizing'}),
                    info: "Give all of a measure's pivot columns one shared width."
                }),
                wrapperOption({
                    label: 'Region order',
                    propName: 'PivotDimensionSpec.sortBy',
                    control: select({
                        bind: 'regionSort',
                        options: SORT_OPTIONS,
                        enableFilter: false,
                        width: 110
                    }),
                    info: 'Order of the region columns. Custom lists US and EU first, the rest after.'
                }),
                wrapperOption({
                    label: 'Summary row',
                    propName: 'GridConfig.showSummary',
                    control: select({
                        model: cubeGridModel,
                        bind: 'showSummary',
                        options: V_SIDE_OPTIONS,
                        enableFilter: false,
                        width: 110
                    }),
                    info: 'Position of the grand total row.'
                })
            ],
            item: panel({
                className: 'tb-grid-wrapper-panel',
                mask: 'onLoad',
                item: gridCmp(),
                tbar: [
                    span('Group by:'),
                    select({
                        bind: 'groupBy',
                        options: [
                            {value: 'fund', label: 'Fund'},
                            {value: 'fund,trader', label: 'Fund › Trader'},
                            {value: 'fund,trader,model', label: 'Fund › Trader › Model'}
                        ],
                        width: 190,
                        enableFilter: false
                    }),
                    span('Pivot by:'),
                    select({
                        bind: 'pivotBy',
                        options: [
                            {value: null, label: 'None'},
                            {value: 'region', label: 'Region'},
                            {value: 'region,sector', label: 'Region › Sector'}
                        ],
                        width: 170,
                        enableFilter: false
                    }),
                    select({
                        bind: 'pivotMeasures',
                        options: [
                            {value: 'mktVal', label: 'Mkt Val'},
                            {value: 'pnl', label: 'Pnl'},
                            {value: 'positions', label: '# Pos'}
                        ],
                        enableMulti: true,
                        enableClear: false,
                        enableFilter: false,
                        hideDropdownIndicator: true,
                        placeholder: 'Measures...',
                        width: 220,
                        omit: !model.pivotBy
                    }),
                    filler(),
                    colChooserButton({gridModel: model.cubeGridModel})
                ],
                bbar: [storeFilterField(), filler(), gridFindField()]
            })
        });
    }
});

const gridCmp = hoistCmp.factory<CubeGridPanelModel>(({model}) =>
    cubeGrid({model: model.cubeGridModel})
);

class CubeGridPanelModel extends HoistModel {
    @bindable accessor groupBy = 'fund,trader';
    @bindable accessor pivotBy = 'region';

    /** Measures pivoted into columns, capped at two - each one multiplies the column count. */
    @bindableRef accessor pivotMeasures = ['mktVal', 'pnl'];

    /** Applied to every pivot dimension through `pivotModel.dimensionDefaults`. */
    @bindable accessor pivotShowSummaries: boolean | HSide = 'left';
    @bindable accessor pivotCollapsible = true;

    /** Region's `sortBy` - `custom` is an explicit value order. */
    @bindable accessor regionSort: 'asc' | 'desc' | 'custom' = 'asc';

    @managed cube: Cube;
    @managed cubeGridModel: CubeGridModel;

    constructor() {
        super();

        this.cube = new Cube({
            idSpec: 'id',
            fields: [
                ...['fund', 'trader', 'model', 'region', 'sector'].map(name => ({
                    name,
                    type: 'string' as const,
                    isDimension: true
                })),
                // A short display name heads columns and pivot headers - the full one is kept for
                // the column chooser, menus and export.
                {
                    name: 'mktVal',
                    displayName: 'Market Value',
                    shortDisplayName: 'Mkt Val',
                    type: 'number' as const,
                    aggregator: 'SUM' as const
                },
                {name: 'pnl', type: 'number' as const, aggregator: 'SUM' as const},
                {
                    name: 'positions',
                    shortDisplayName: '# Pos',
                    type: 'int' as const,
                    aggregator: 'LEAF_COUNT' as const
                }
            ]
        });

        // The model owns the view it creates here. Pivot columns appear once the cube has data.
        const positions = {width: 80, align: 'right' as const},
            mktVal = {width: 120, renderer: v => fmtMillions(v, {precision: 2, label: true})},
            pnl = {
                width: 110,
                absSort: true,
                renderer: v => fmtNumber(v, {precision: 0, colorSpec: true})
            };
        // One set of specs serves both regions: as fixed columns, shown whether or not the
        // query pivots, where a measure's bare field is its row summary - and as the pivot
        // columns built for each path to their right.
        const columns = [
            {field: 'positions', ...positions},
            {field: 'mktVal', ...mktVal},
            {field: 'pnl', ...pnl}
        ];
        this.cubeGridModel = new CubeGridModel({
            cube: this.cube,
            query: this.queryConfig(),
            columns,
            // Managed autosize fits the tree column to its fund names, and re-fits whenever a
            // structural change mints new columns.
            gridConfig: {
                showSummary: 'top',
                sizingMode: 'compact',
                autosizeOptions: {mode: 'managed'}
            },
            pivotConfig: {
                dimensions: this.pivotDimensions,
                dimensionDefaults: this.pivotDimensionDefaults,
                measures: columns.map(column => ({field: column.field, column}))
            }
        });

        // Query config lives on the query - the grid follows without being rebuilt.
        this.addReaction(
            {
                track: () => [this.groupBy, this.pivotBy, this.pivotMeasures],
                run: () => this.cubeGridModel.view.updateQuery(this.queryConfig())
            },
            {
                track: () => this.pivotDimensions,
                equals: 'structural',
                run: dimensions => (this.cubeGridModel.pivotModel.dimensions = dimensions)
            },
            {
                track: () => this.pivotDimensionDefaults,
                equals: 'structural',
                run: defaults => (this.cubeGridModel.pivotModel.dimensionDefaults = defaults)
            }
        );
    }

    // Each dimension's summary names what it aggregates.
    private get pivotDimensions(): PivotDimensionSpec[] {
        const {regionSort} = this;
        return [
            {
                field: 'region',
                summaryLabel: 'All Regions',
                sortBy: regionSort === 'custom' ? ['US', 'EU'] : regionSort
            },
            {field: 'sector', summaryLabel: 'All Sectors'},
            {field: 'model', summaryLabel: 'All Models'}
        ];
    }

    private get pivotDimensionDefaults(): Omit<PivotDimensionSpec, 'field'> {
        return {showSummary: this.pivotShowSummaries, collapsible: this.pivotCollapsible};
    }

    /** Keeps the most recent picks, so a third choice replaces the oldest. */
    @action
    setPivotMeasures(measures: string[]) {
        this.pivotMeasures = takeRight(measures ?? [], 2);
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const raw = await XH.portfolioService.getPricedRawPositionsAsync({loadSpec});
        if (loadSpec.isStale) return;
        await this.cube.loadDataAsync(raw.map((it, id) => ({...it, id})));
    }

    private queryConfig(): QueryConfig {
        const {pivotBy, pivotMeasures} = this;
        return {
            dimensions: this.groupBy.split(','),
            includeRoot: true,
            pivot: pivotBy ? {dimensions: pivotBy.split(','), measures: pivotMeasures} : null
        };
    }
}

const SORT_OPTIONS = [
    {value: 'asc', label: 'Ascending'},
    {value: 'desc', label: 'Descending'},
    {value: 'custom', label: 'Custom'}
];

const H_SIDE_OPTIONS = [
    {value: false, label: 'None'},
    {value: 'left', label: 'Left'},
    {value: 'right', label: 'Right'}
];

const V_SIDE_OPTIONS = [
    {value: false, label: 'None'},
    {value: 'top', label: 'Top'},
    {value: 'bottom', label: 'Bottom'}
];
