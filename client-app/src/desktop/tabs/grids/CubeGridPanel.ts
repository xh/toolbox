import {filler, span} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {cubeGrid, CubeGridModel} from '@xh/hoist/cmp/cubegrid';
import type {LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import type {QueryConfig} from '@xh/hoist/data';
import {Cube} from '@xh/hoist/data';
import {gridFindField} from '@xh/hoist/desktop/cmp/grid';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {wrapper, wrapperOption} from '../../common/Wrapper';

export const cubeGridPanel = hoistCmp.factory({
    model: creates(() => CubeGridPanelModel),
    render({model}) {
        const {cubeGridModel} = model;
        return wrapper({
            title: 'Cube Grid',
            icon: Icon.gridPanel(),
            description: [
                'The `CubeGrid` component renders a `Cube` `View` as a tree grid. Give its model a',
                'cube and a query and it owns the view, the store and the grid - no wiring needed.',
                '',
                'The app writes the fixed columns, as for any grid. When the query sets `pivot`, the',
                'view slices its measures across a *pivot* axis and the grid appends a column group',
                'per pivot value to the right of those columns, so a low-cardinality dimension',
                '(region, asset class) becomes columns rather than another level of row grouping.',
                '',
                'All query configuration - groupings, pivot dimensions, measures - lives on the',
                '`Query`. Apps reconfigure by calling `view.updateQuery()` and the grid follows.',
                '',
                '`StoreFilterField` and `GridFindField` bind to the `CubeGridModel` from context and',
                'search the fields of its visible columns - the group labels and every pivot cell.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/CubeGridPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/cubegrid/CubeGrid.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/cubegrid/CubeGridModel.ts',
                    notes: 'Presentation config - fixed columns, summaries, pivot sort, value column specs.'
                },
                {
                    url: '$HR/data/cube/pivot/impl/PivotCells.ts',
                    notes: 'The data layer. Produces the cells this grid renders.'
                },
                {
                    url: '$HR/data/cube/Query.ts',
                    notes: 'Query spec - `dimensions` plus `pivot.dimensions` and `pivot.valueFields`.'
                }
            ],
            options: [
                wrapperOption({
                    label: 'Pivot summary',
                    propName: 'CubeGridConfig.pivotSummary',
                    control: select({
                        model: cubeGridModel,
                        bind: 'pivotSummary',
                        options: H_SIDE_OPTIONS,
                        enableFilter: false,
                        width: 110
                    }),
                    info: "Docked column with each row's total across all pivot values."
                }),
                wrapperOption({
                    label: 'Pivot subtotal',
                    propName: 'CubeGridConfig.pivotSubtotal',
                    control: select({
                        model: cubeGridModel,
                        bind: 'pivotSubtotal',
                        options: H_SIDE_OPTIONS,
                        enableFilter: false,
                        width: 110
                    }),
                    info: 'Subtotal within each group - needs two pivot dimensions.'
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
                    info: "The grid's summary row, delegated to GridModel.showSummary."
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
                    })
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
                {name: 'mktVal', type: 'number' as const, aggregator: 'SUM' as const},
                {name: 'pnl', type: 'number' as const, aggregator: 'SUM' as const},
                {name: 'positions', type: 'int' as const, aggregator: 'LEAF_COUNT' as const}
            ]
        });

        // The model owns the view it creates here. Pivot columns appear once the cube has data.
        const mktVal = {width: 120, renderer: v => fmtMillions(v, {precision: 2, label: true})},
            pnl = {width: 110, renderer: v => fmtNumber(v, {precision: 0, colorSpec: true})};
        this.cubeGridModel = new CubeGridModel({
            cube: this.cube,
            query: this.queryConfig(),
            // Fixed columns, shown whether or not the query pivots. A measure's bare field is its
            // row total, so these double as the totals for the pivot columns to their right.
            columns: [
                {field: 'positions', headerName: '# Pos', width: 80, align: 'right'},
                {field: 'mktVal', ...mktVal},
                {field: 'pnl', ...pnl}
            ],
            pivotSubtotal: 'right',
            pivotValueSpecs: {mktVal, pnl},
            // Managed autosize fits the tree column to its fund names, and re-fits whenever a
            // structural change mints new columns.
            gridConfig: {
                showSummary: 'top',
                sizingMode: 'compact',
                autosizeOptions: {mode: 'managed'}
            }
        });

        // Query config lives on the query - the grid follows without being rebuilt.
        this.addReaction({
            track: () => [this.groupBy, this.pivotBy],
            run: () => this.cubeGridModel.view.updateQuery(this.queryConfig())
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const raw = await XH.portfolioService.getPricedRawPositionsAsync({loadSpec});
        if (loadSpec.isStale) return;
        await this.cube.loadDataAsync(raw.map((it, id) => ({...it, id})));
    }

    private queryConfig(): QueryConfig {
        const {pivotBy} = this;
        return {
            dimensions: this.groupBy.split(','),
            fields: ['fund', 'trader', 'model', 'region', 'sector', 'mktVal', 'pnl', 'positions'],
            includeRoot: true,
            pivot: pivotBy ? {dimensions: pivotBy.split(','), valueFields: ['mktVal', 'pnl']} : null
        };
    }
}

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
