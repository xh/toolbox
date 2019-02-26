import {managed, HoistModel, LoadSupport} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, thousandsRenderer} from '@xh/hoist/format';
import {emptyFlexCol} from '@xh/hoist/cmp/grid';
import {wait} from '@xh/hoist/promise';

import {companyTrades} from '../../core/data';

@HoistModel
@LoadSupport
export class GridPageModel {

    @managed
    gridModel = new GridModel({
        stateModel: 'toolboxSampleGrid',
        sortBy: ['profit_loss|desc|abs'],
        enableColChooser: true,
        store: new LocalStore({
            fields: ['company', 'city', 'trade_volume', 'profit_loss']
        }),
        columns: [
            {
                field: 'company',
                pinned: true,
                hideable: false,
                width: 170
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
            },
            {...emptyFlexCol}
        ]
    });

    async doLoadAsync(loadSpec) {
        return wait(500).then(() => {
            this.gridModel.loadData(companyTrades);
        });
    }

}