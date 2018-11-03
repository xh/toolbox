import {HoistModel, XH} from '@xh/hoist/core';
import {numberRenderer} from '@xh/hoist/format';
import {GridModel} from '@xh/hoist/cmp/grid';
import {LocalStore} from '@xh/hoist/data';
import {PendingTaskModel} from '@xh/hoist/utils/async';

@HoistModel
export class StrategyGridModel {

    loadModel = new PendingTaskModel();

    gridModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'name', 'quantity', 'pnl']
        }),
        sortBy: [{colId: 'pnl', sort: 'desc', abs: true}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
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
                isTreeColumn: true
            },
            {
                field: 'quantity',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
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
            }
        ]
    });

    loadData(dimensions) {
        XH.portfolioService.getPortfolioAsync(dimensions)
            .then(portfolio => {
                this.gridModel.loadData(portfolio);
                this.gridModel.selectFirst();
            })
            .linkTo(this.loadModel);
    }
}