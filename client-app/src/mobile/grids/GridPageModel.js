/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/mobile/cmp/grid';
import {LastPromiseModel} from '@xh/hoist/promise';
import {LocalStore} from '@xh/hoist/data';
import {baseCol} from '@xh/hoist/columns/Core';
import {numberRenderer} from '@xh/hoist/format';

import {companyTrades} from '../../core/data';

@HoistModel()
export class GridPageModel {

    loadModel = new LastPromiseModel();

    gridModel = new GridModel({
        store: new LocalStore({
            fields: ['company', 'profit_loss']
        }),
        leftColumn: baseCol({
            headerName: 'Company',
            field: 'company'
        }),
        rightColumn: baseCol({
            headerName: 'P&L',
            field: 'profit_loss',
            valueFormatter: numberRenderer({
                precision: 0,
                ledger: true,
                colorSpec: true,
                asElement: true
            })
        })
    });

    constructor() {
        this.gridModel.loadData(companyTrades);
    }

    destroy() {
        XH.safeDestroy(this.gridModel);
        XH.safeDestroy(this.loadModel);
    }

}