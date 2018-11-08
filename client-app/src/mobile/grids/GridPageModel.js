import {XH, HoistModel} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';

import {companyTrades} from '../../core/data';

@HoistModel
export class GridPageModel {

    loadModel = new PendingTaskModel();

    gridModel = new GridModel({
        stateModel: 'toolboxSampleGrid',
        sortBy: ['profit_loss|desc|abs'],
        store: new LocalStore({
            fields: ['company', 'city', 'trade_volume', 'profit_loss']
        }),
        columns: [
            {
                field: 'company',
                flex: true
            },
            {
                headerName: 'P&L',
                field: 'profit_loss',
                width: 120,
                align: 'right',
                absSort: true,
                renderer: numberRenderer({precision: 0, ledger: true, colorSpec: true})
            }
        ]
    });

    constructor() {
        this.gridModel.loadData(companyTrades);
    }

    destroy() {
        XH.safeDestroy(this.gridModel);
        XH.safeDestroy(this.loadModel);
    }

}