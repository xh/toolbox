import {HoistModel, XH, managed, LoadSupport} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {DimensionChooserModel} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {GridModel} from '@xh/hoist/cmp/grid';
import {LocalStore} from '@xh/hoist/data';

@HoistModel
@LoadSupport
export class PositionsPanelModel {

    @bindable loadTimestamp;

    @managed
    dimChooserModel = new DimensionChooserModel({
        dimensions: [
            {value: 'fund', label: 'Fund'},
            {value: 'model', label: 'Model'},
            {value: 'region', label: 'Region'},
            {value: 'sector', label: 'Sector'},
            {value: 'symbol', label: 'Symbol'},
            {value: 'trader', label: 'Trader'}
        ],
        historyPreference: 'portfolioDimHistory'
    });

    @managed
    gridModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'name', 'pnl', 'mktVal']
        }),
        sortBy: 'pnl|desc|abs',
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        compact: XH.appModel.useCompactGrids,
        stateModel: 'portfolio-positions-grid',
        columns: [
            {
                field: 'id',
                headerName: 'ID',
                width: 40,
                hidden: true
            },
            {
                field: 'name',
                headerName: 'Name',
                flex: 1,
                minWidth: 180,
                isTreeColumn: true
            },
            {
                field: 'mktVal',
                headerName: 'Mkt Value (m)',
                headerTooltip: 'Market value (in millions USD)',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: millionsRenderer({
                    precision: 3,
                    ledger: true,
                    tooltip: true
                })
            },
            {
                field: 'pnl',
                headerName: 'P&L',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true,
                    tooltip: true
                })
            }
        ]
    });

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    constructor() {
        this.addReaction({
            track: () => this.dimChooserModel.value,
            run: this.loadAsync
        });
    }

    async doLoadAsync(loadSpec) {
        const {gridModel, dimChooserModel} = this,
            dims = dimChooserModel.value;

        return XH.portfolioService
            .getPortfolioAsync(dims)
            .then(portfolio => {
                gridModel.loadData(portfolio);
                if (!gridModel.selectedRecord) {
                    gridModel.selectFirst();
                }
                this.setLoadTimestamp(Date.now());
            })
            .track({
                category: 'Portfolio Viewer',
                message: 'Loaded positions',
                data: {dims},
                loadSpec
            });
    }
}