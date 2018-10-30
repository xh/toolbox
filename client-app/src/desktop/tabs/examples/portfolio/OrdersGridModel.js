import {HoistModel} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {LocalStore} from '@xh/hoist/data';
import {emptyFlexCol} from '@xh/hoist/cmp/grid/columns';
import {PendingTaskModel} from '@xh/hoist/utils/async';

@HoistModel
export class OrdersGridModel {

    loadModel = new PendingTaskModel();
    gridModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'symbol', 'time', 'dir']
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
                width: 100,
                tooltip: false
            },
            {
                field: 'time',
                headerName: 'Execution Time',
                align: 'right',
                width: 150,
                tooltip: false
            },
            {
                field: 'dir',
                headerName: 'Direction',
                width: 100,
                tooltip: false
            },
            {...emptyFlexCol}
        ]
    });
}