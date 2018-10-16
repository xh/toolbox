import {HoistModel} from '@xh/hoist/core';
import {numberRenderer} from '@xh/hoist/format';
import {GridModel} from '@xh/hoist/desktop/cmp/grid';
import {LocalStore} from '@xh/hoist/data';
import {emptyFlexCol} from '@xh/hoist/columns';
import {PortfolioDataService} from './PortfolioDataService';
import {PendingTaskModel} from '@xh/hoist/utils/async';

@HoistModel
export class PortfolioPanelModel {

    portfolioDataService = new PortfolioDataService();
    loadModel = new PendingTaskModel();

    strategyGridModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'name', 'volume', 'pnl']
        }),
        sortBy: [{colId: 'name', sort: 'asc'}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        columns: [
            {
                headerName: 'Name',
                width: 200,
                field: 'name',
                isTreeColumn: true
            },
            {
                headerName: 'Volume',
                field: 'volume',
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
            },
            {
                headerName: 'P&L',
                field: 'pnl',
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
            },
            {...emptyFlexCol}
        ]
    });

    ordersGridModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'symbol', 'time', 'trader', 'dir', 'volume', 'pnl']
        }),
        sortBy: [{colId: 'time', sort: 'asc'}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        columns: [
            {
                field: 'id',
                headerName: 'ID',
                hide: true
            },
            {
                field: 'symbol',
                headerName: 'Instrument',
                width: 200,
                tooltip: false
            },
            {
                field: 'time',
                headerName: 'Execution Time',
                width: 200,
                tooltip: false
            },
            {
                field: 'trader',
                headerName: 'Trader',
                width: 200,
                tooltip: false
            },
            {
                field: 'dir',
                headerName: 'Direction',
                width: 100,
                tooltip: false
            },
            {
                field: 'volume',
                headerName: 'Quantity',
                width: 190,
                tooltip: false
            },
            {
                field: 'pnl',
                headerName: 'PnL',
                width: 190,
                tooltip: false
            }
        ]
    });

    constructor() {
        this.addReaction(this.loadPortfolioReaction());
        this.addReaction(this.loadOrdersReaction());
    }

    loadPortfolioReaction() {
        return {
            track: () => this.portfolioDataService.portfolio,
            run: (portfolio) => {
                this.strategyGridModel.loadData(portfolio);
            },
            fireImmediately: true
        };
    }

    loadOrdersReaction() {
        return {
            track: () => this.strategyGridModel.selectedRecord,
            run: (record) => {
                if (record !== null) {
                    this.ordersGridModel.loadData(this.portfolioDataService.getOrdersForPosition(record.id));
                } else {
                    this.ordersGridModel.loadData([]);
                }
            }
        };
    }
}