import {HoistModel, XH} from '@xh/hoist/core';
import {AgGridModel} from '@xh/hoist/cmp/ag-grid';
import {bindable} from '@xh/hoist/mobx';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';

export class AgGridViewModel extends HoistModel {

    get isLoadSupport() {return true}

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
        sizingMode: XH.appModel.gridSizingMode
    });

    constructor() {
        super();
        const {agGridModel} = this;
        this.addReaction({
            track: () => [this.data, agGridModel.agApi],
            run: ([data, api]) => {
                if (api) api.setRowData(data);
            }
        });
    }

    async doLoadAsync(loadSpec) {
        const data = await XH.portfolioService.getRawPositionsAsync({loadSpec});
        this.setData(data);
    }
}
