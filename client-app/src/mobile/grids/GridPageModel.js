import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {cityCol, companyCol, profitLossCol, tradeVolumeCol} from '../../core/columns';

export class GridPageModel extends HoistModel {

    @bindable.ref
    dateLoaded = null;

    @managed
    gridModel = new GridModel({
        persistWith: {localStorageKey: 'toolboxSampleGrid'},
        sortBy: ['profit_loss|desc|abs'],
        colChooserModel: true,
        onRowClicked: ({data: record}) => {
            const {id} = record;
            XH.appendRoute('gridDetail', {id});
        },
        columns: [
            {
                ...companyCol,
                pinned: true,
                hideable: false,
                width: 170,
                autosizeMaxWidth: 200,
                flex: null
            },
            {...cityCol},
            {...profitLossCol},
            {...tradeVolumeCol}
        ]
    });

    constructor() {
        super();
        makeObservable(this);
    }

    async doLoadAsync(loadSpec) {
        await wait(500);
        const customers = await XH.fetchJson({url: 'customer'});
        this.gridModel.loadData(customers);
        this.setDateLoaded(new Date());
    }

}