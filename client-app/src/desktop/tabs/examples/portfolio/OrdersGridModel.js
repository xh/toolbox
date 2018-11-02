import {HoistModel, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {LocalStore} from '@xh/hoist/data';
import {emptyFlexCol} from '@xh/hoist/cmp/grid/columns';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {isNil} from 'lodash';
import {numberRenderer} from '@xh/hoist/format';

@HoistModel
export class OrdersGridModel {

    loadModel = new PendingTaskModel();
    gridModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'symbol', 'time', 'trader', 'dir', 'volume', 'pnl']
        }),
        sortBy: [{colId: 'time', sort: 'asc'}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        columns: [
            {
                field: 'symbol',
                headerName: 'Instrument',
                width: 100,
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
                headerName: 'Volume',
                width: 100,
                tooltip: false,
                align: 'right',
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    tooltip: true
                })
            },
            {
                field: 'pnl',
                headerName: 'P&L',
                width: 150,
                tooltip: false,
                align: 'right',
                renderer: numberRenderer({
                    precision: 2,
                    ledger: true,
                    colorSpec: true,
                    tooltip: true
                })
            },
            {
                field: 'time',
                headerName: 'Execution Time',
                align: 'right',
                width: 150,
                tooltip: false
            },
            {...emptyFlexCol}
        ]

        // dir, instrument, qty, pnl, time
    });

    loadData(recordId) {
        if (!isNil(recordId)) {
            XH.portfolioService.getOrders(recordId)
                .then(orders => {
                    this.gridModel.loadData(orders);
                    if (orders.length > 0) {
                        this.gridModel.selectFirst();
                    }
                })
                .linkTo(this.loadModel);
        } else {
            this.gridModel.loadData([]);
        }

    }
}