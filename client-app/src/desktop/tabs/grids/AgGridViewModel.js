import {HoistModel, XH} from '@xh/hoist/core';
import {AgGridModel} from '@xh/hoist/cmp/ag-grid';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';
import {App} from '../../../apps/app';

export class AgGridViewModel extends HoistModel {

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
            filter: 'agNumberColumnFilter',
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
            filter: 'agNumberColumnFilter',
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
        sizingMode: XH.sizingMode
    });

    constructor() {
        super();
        makeObservable(this);
        const {agGridModel} = this;
        this.addReaction({
            track: () => [this.data, agGridModel.agApi],
            run: ([data, api]) => {
                if (api) api.setRowData(data);
            }
        });
    }

    async doLoadAsync(loadSpec) {
        const data = await App.portfolioService.getRawPositionsAsync({loadSpec});
        this.setData(data);
    }
}
