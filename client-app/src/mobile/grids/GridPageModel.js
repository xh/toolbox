/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/mobile/cmp/grid';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {LocalStore} from '@xh/hoist/data';
import {emptyFlexCol} from '@xh/hoist/columns';
import {millionsRenderer, numberRenderer} from '@xh/hoist/format';

import {companyTrades} from '../../core/data';

@HoistModel
export class GridPageModel {

    loadModel = new PendingTaskModel();

    gridModel = new GridModel({
        store: new LocalStore({
            fields: ['company', 'city', 'trade_volume', 'profit_loss']
        }),
        columns: [
            {
                field: 'company',
                width: 150,
                pinned: true
            },
            {
                field: 'city',
                width: 120
            },
            {
                headerName: 'Volume',
                field: 'trade_volume',
                width: 100,
                align: 'right',
                renderer: millionsRenderer({precision: 1, label: true})
            },
            {
                headerName: 'P&L',
                field: 'profit_loss',
                width: 100,
                align: 'right',
                absSort: true,
                renderer: numberRenderer({precision: 0, ledger: true, colorSpec: true})
            },
            {...emptyFlexCol}
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