import {HoistModel, LoadSupport, XH} from '@xh/hoist/core';
import {AgGridModel} from '@xh/hoist/cmp/grid/ag-grid';
import {observable, settable} from '@xh/hoist/mobx';

@HoistModel
@LoadSupport
export class AgGridViewModel {
    @observable.ref @settable data = [];

    columnDefs = [
        {
            colId: 'firstName',
            field: 'firstName',
            filter: 'agTextColumnFilter'
        },
        {
            colId: 'lastName',
            field: 'lastName',
            filter: 'agTextColumnFilter'
        },
        {
            colId: 'email',
            field: 'email',
            filter: 'agTextColumnFilter'
        },
        {
            colId: 'gender',
            field: 'gender',
            enableRowGroup: true,
            enablePivot: true,
            enableValue: true
        },
        {
            colId: 'favoriteColor',
            field: 'favoriteColor',
            enableRowGroup: true,
            enablePivot: true,
            enableValue: true
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
                if (isReady) {
                    agGridModel.agApi.setRowData(data);
                }
            }
        });
    }

    async doLoadAsync() {
        const data = await XH.fetchJson({
            url: 'https://my.api.mockaroo.com/directory.json?key=01df86d0',
            fetchOpts: {
                credentials: 'omit'
            }
        });

        this.setData(data || []);
    }
}