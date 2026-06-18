import {HoistModel, LoadSpec, XH} from '@xh/hoist/core';
import {AgGridModel} from '@xh/hoist/cmp/ag-grid';
import {observable, makeObservable, runInAction} from '@xh/hoist/mobx';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';

export class AgGridViewModel extends HoistModel {
    @observable.ref data = [];

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
            cellRenderer: ({value}) =>
                fmtMillions(value, {
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
            cellRenderer: ({value}) =>
                fmtNumber(value, {
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

        this.addReaction({
            track: () => [this.data, this.agGridModel.agApi] as const,
            run: ([data, api]) => {
                if (api) api.updateGridOptions({rowData: data});
            }
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const data = await XH.portfolioService.getPricedRawPositionsAsync({loadSpec});
        runInAction(() => (this.data = data));
    }
}
