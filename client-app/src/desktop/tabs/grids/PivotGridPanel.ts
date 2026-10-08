import {filler, span} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {pivotGrid, PivotGridModel} from '@xh/hoist/cmp/pivotgrid';
import type {LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import type {View} from '@xh/hoist/data';
import {Cube} from '@xh/hoist/data';
import {gridFindField} from '@xh/hoist/desktop/cmp/grid';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, observableRef, runInAction} from '@xh/hoist/mobx';
import {wrapper} from '../../common/Wrapper';

export const pivotGridPanel = hoistCmp.factory({
    model: creates(() => PivotGridPanelModel),
    render() {
        return wrapper({
            title: 'Pivot Grid',
            icon: Icon.gridPanel(),
            description: [
                'The `PivotGrid` component renders a pivoted `View` - a `Cube` query that slices its',
                'measures across a *pivot* axis, so extra dimensions become nested column groups',
                'rather than more levels of row grouping.',
                '',
                'Use it for summary grids: pivot on a low-cardinality dimension (region, asset class)',
                'that would make an inefficient tree grouping, and keep the cardinality in the rows.',
                '',
                'All query configuration - groupings, pivot dimensions, measures - lives on the',
                '`Query` under `pivot`. Apps reconfigure by calling `view.updateQuery()` and the grid follows.',
                '',
                '`StoreFilterField` and `GridFindField` bind to the `PivotGridModel` from context and',
                'search the fields of its visible columns - the group labels and every pivot cell.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/PivotGridPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/pivotgrid/PivotGrid.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/pivotgrid/PivotGridModel.ts',
                    notes: 'Presentation config - summaries, pivot sort, value column specs.'
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
                            {value: 'region', label: 'Region'},
                            {value: 'region,sector', label: 'Region › Sector'}
                        ],
                        width: 170,
                        enableFilter: false
                    }),
                    filler(),
                    switchInput({bind: 'showSummaries', label: 'Summaries'})
                ],
                bbar: [storeFilterField(), filler(), gridFindField()]
            })
        });
    }
});

/** Held back until the first load - the grid model binds to a view, and a view needs data. */
const gridCmp = hoistCmp.factory<PivotGridPanelModel>(({model}) =>
    model.pivotGridModel ? pivotGrid({model: model.pivotGridModel}) : null
);

class PivotGridPanelModel extends HoistModel {
    @bindable accessor groupBy = 'fund,trader';
    @bindable accessor pivotBy = 'region';
    @bindable accessor showSummaries = true;

    @managed cube: Cube;
    @managed view: View;
    @managed @observableRef accessor pivotGridModel: PivotGridModel;

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
                {name: 'pnl', type: 'number' as const, aggregator: 'SUM' as const}
            ]
        });

        // Query config lives on the query - the grid follows without being rebuilt.
        this.addReaction(
            {
                track: () => [this.groupBy, this.pivotBy],
                run: () => this.view?.updateQuery(this.queryConfig())
            },
            {
                track: () => this.showSummaries,
                run: show => {
                    // Null until the first load succeeds - the mask clears on a failed load too.
                    const m = this.pivotGridModel;
                    if (!m) return;
                    m.rowSummary = show ? 'right' : false;
                    m.valueSummary = show ? 'top' : false;
                }
            }
        );
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const raw = await XH.portfolioService.getPricedRawPositionsAsync({loadSpec});
        if (loadSpec.isStale) return;

        await this.cube.loadDataAsync(raw.map((it, id) => ({...it, id})));
        if (this.pivotGridModel) return;

        // First load only - the view needs data before it can discover its pivot paths, and the
        // grid model binds to a view for life.
        const view = this.cube.createView({query: this.queryConfig(), connect: true});
        runInAction(() => {
            this.view = view;
            this.pivotGridModel = new PivotGridModel({
                view,
                rowSummary: 'right',
                valueSummary: 'top',
                valueColumnSpecs: {
                    mktVal: {
                        width: 120,
                        renderer: v => fmtMillions(v, {precision: 2, label: true})
                    },
                    pnl: {width: 110, renderer: v => fmtNumber(v, {precision: 0, colorSpec: true})}
                },
                // Managed autosize fits the tree column to its fund names, and re-fits whenever a
                // structural change mints new columns.
                gridConfig: {
                    sizingMode: 'compact',
                    autosizeOptions: {mode: 'managed'}
                }
            });
        });
    }

    private queryConfig() {
        return {
            dimensions: this.groupBy.split(','),
            fields: ['fund', 'trader', 'model', 'region', 'sector', 'mktVal', 'pnl'],
            includeRoot: true,
            pivot: {dimensions: this.pivotBy.split(','), valueFields: ['mktVal', 'pnl']}
        };
    }
}
