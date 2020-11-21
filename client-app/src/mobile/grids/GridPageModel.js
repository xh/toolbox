import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {numberRenderer, thousandsRenderer} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';

export class GridPageModel extends HoistModel {

    @bindable.ref
    dateLoaded = null;

    @managed
    gridModel = new GridModel({
        persistWith: {localStorageKey: 'toolboxSampleGrid'},
        sortBy: ['profit_loss|desc|abs'],
        colChooserModel: true,
        columns: [
            {
                field: 'company',
                pinned: true,
                hideable: false,
                width: 170,
                autosizeMaxWidth: 200
            },
            {
                field: 'city',
                width: 120
            },
            {
                headerName: 'P&L',
                field: 'profit_loss',
                width: 120,
                align: 'right',
                absSort: true,
                renderer: numberRenderer({precision: 0, ledger: true, colorSpec: true})
            },
            {
                headerName: 'Volume',
                field: 'trade_volume',
                width: 90,
                align: 'right',
                renderer: thousandsRenderer({precision: 1, label: true})
            }
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