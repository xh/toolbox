import {HoistModel, LoadSupport, XH} from '@xh/hoist/core';
import {AgGridModel} from '@xh/hoist/cmp/ag-grid';
import {observable, settable} from '@xh/hoist/mobx';
import {fmtMillions, fmtNumber} from '@xh/hoist/format';
import {isNil, isEmpty} from 'lodash';

@HoistModel
@LoadSupport
export class AgGridViewModel {
    @observable.ref @settable data = [];

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
        compact: XH.appModel.useCompactGrids
    });

    constructor() {
        const {agGridModel} = this;
        this.addReaction({
            track: () => [this.data, agGridModel.agApi],
            run: ([data, api]) => {
                console.log(data);
                if (api && !isEmpty(data)) {
                    api.setRowData(data);

                    // Also load our grid view state now that we have data
                    this.reloadCurrentGridView();
                }
            }
        });
    }

    saveCurrentGridView() {
        const state = this.agGridModel.getState();
        XH.localStorageService.set('agGridWrapperView', state);
    }

    reloadCurrentGridView() {
        const state = XH.localStorageService.get('agGridWrapperView', null);
        if (!isNil(state)) {
            this.agGridModel.setState(state);
        }
    }

    async doLoadAsync() {
        const data = await XH.portfolioService.getPositionsAsync();
        this.setData(data);
    }
}