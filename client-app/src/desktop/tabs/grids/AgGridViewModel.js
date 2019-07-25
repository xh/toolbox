import {HoistModel, LoadSupport, XH} from '@xh/hoist/core';
import {AgGridModel} from '@xh/hoist/cmp/ag-grid';
import {bindable} from '@xh/hoist/mobx';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';

@HoistModel
@LoadSupport
export class AgGridViewModel {
    @bindable.ref data = [];

    columnDefs = [
        {
            field: 'symbol',
            filter: 'agTextColumnFilter',
            enableRowGroup: true,
            enablePivot: true
        },
        {
            field: 'sector',
            enableRowGroup: true,
            enablePivot: true
        },
        {
            field: 'model',
            enableRowGroup: true,
            enablePivot: true
        },
        {
            field: 'fund',
            enableRowGroup: true,
            enablePivot: true
        },
        {
            field: 'region',
            enableRowGroup: true,
            enablePivot: true
        },
        {
            field: 'trader',
            enableRowGroup: true,
            enablePivot: true
        },
        {
            field: 'mktVal',
            type: 'numericColumn',
            filter: 'agNumberFilter',
            width: 130,
            enableValue: true,
            aggFunc: 'sum',
            cellRenderer: ({value}) => fmtMillions(value, {
                precision: 3,
                ledger: true
            })
        },
        {
            field: 'pnl',
            type: 'numericColumn',
            filter: 'agNumberFilter',
            width: 130,
            enableValue: true,
            aggFunc: 'sum',
            cellRenderer: ({value}) => fmtNumber(value, {
                precision: 0,
                ledger: true,
                colorSpec: true
            })
        }
    ];

    agGridModel = new AgGridModel({
        compact: XH.appModel.useCompactGrids
    });

    constructor() {
        const {agGridModel} = this;
        this.addReaction({
            track: () => [this.data, agGridModel.isReady],
            run: ([data, isReady]) => {
                if (isReady) agGridModel.agApi.setRowData(data);
            }
        });

        if (agGridModel.isReady) agGridModel.getState();
    }

    async doLoadAsync() {
        const data = await XH.portfolioService.getPositionsAsync();
        this.setData(data);
    }
}