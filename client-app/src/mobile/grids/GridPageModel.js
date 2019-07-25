import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {emptyFlexCol, GridModel} from '@xh/hoist/cmp/grid';
import {numberRenderer, thousandsRenderer} from '@xh/hoist/format';
import {wait} from '@xh/hoist/promise';

@HoistModel
@LoadSupport
export class GridPageModel {

    @managed
    gridModel = new GridModel({
        stateModel: 'toolboxSampleGrid',
        sortBy: ['profit_loss|desc|abs'],
        enableColChooser: true,
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
        await wait(500);
        const companyTrades = await XH.fetchJson({url: 'customer'});
        this.gridModel.loadData(companyTrades);
    }

}