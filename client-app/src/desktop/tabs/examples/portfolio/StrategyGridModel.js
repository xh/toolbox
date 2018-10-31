import {HoistModel, XH} from '@xh/hoist/core';
import {numberRenderer} from '@xh/hoist/format';
import {GridModel} from '@xh/hoist/cmp/grid';
import {LocalStore} from '@xh/hoist/data';
import {emptyFlexCol} from '@xh/hoist/cmp/grid/columns';
import {PendingTaskModel} from '@xh/hoist/utils/async';

@HoistModel
export class StrategyGridModel {

    loadModel = new PendingTaskModel();
    gridModel = new GridModel({
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

    loadData(dimensions) {
        XH.portfolioService.getPortfolioAsync(dimensions)
            .then(portfolio => {
                this.gridModel.loadData(portfolio);
                this.gridModel.selectFirst();
            })
            .linkTo(this.loadModel);
    }
}