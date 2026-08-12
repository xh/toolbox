import {filler, span} from '@xh/hoist/cmp/layout';
import {pivotGrid, PivotGridModel} from '@xh/hoist/cmp/pivotgrid';
import {creates, hoistCmp, HoistModel, LoadSpec, managed, XH} from '@xh/hoist/core';
import {Cube, PivotView} from '@xh/hoist/data';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable, observable, runInAction} from '@xh/hoist/mobx';
import {wrapper} from '../../common';

export const pivotGridPanel = hoistCmp.factory({
    model: creates(() => PivotGridPanelModel),
    render() {
        return wrapper({
            title: 'Pivot Grid',
            icon: Icon.gridPanel(),
            description: [
                'The `PivotGrid` component renders a `PivotView` - a `Cube` query that slices its',
                'measures across a *pivot* axis, so extra dimensions become nested column groups',
                'rather than more levels of row grouping.',
                '',
                'Use it for summary grids: pivot on a low-cardinality dimension (region, asset class)',
                'that would make an inefficient tree grouping, and keep the cardinality in the rows.',
                '',
                'All query configuration - groupings, pivot dimensions, measures - lives on the',
                '`PivotQuery`. Apps reconfigure by calling `view.updateQuery()` and the grid follows.'
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
                    url: '$HR/data/cube/PivotView.ts',
                    notes: 'The data layer. Produces the cells this grid renders.'
                },
                {
                    url: '$HR/data/cube/PivotQuery.ts',
                    notes: 'Query spec - dimensions, pivotDimensions, valueFields.'
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
                ]
            })
        });
    }
});

/** Held back until the first load - the grid model binds to a view, and a view needs data. */
const gridCmp = hoistCmp.factory<PivotGridPanelModel>(({model}) =>
    model.pivotGridModel ? pivotGrid({model: model.pivotGridModel}) : null
);

class PivotGridPanelModel extends HoistModel {
    @bindable groupBy = 'fund,trader';
    @bindable pivotBy = 'region';
    @bindable showSummaries = true;

    @managed cube: Cube;
    @managed view: PivotView;
    @managed @observable.ref pivotGridModel: PivotGridModel;

    constructor() {
        super();
        makeObservable(this);

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
        const view = this.cube.createPivotView({query: this.queryConfig(), connect: true});
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
            pivotDimensions: this.pivotBy.split(','),
            fields: ['fund', 'trader', 'model', 'region', 'sector', 'mktVal', 'pnl'],
            valueFields: ['mktVal', 'pnl'],
            includeRoot: true
        };
    }
}
