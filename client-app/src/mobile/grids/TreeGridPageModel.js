/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {DimChooserModel} from '@xh/hoist/mobile/cmp/dimChooser';
import {observable} from 'mobx';

@HoistModel
export class TreeGridPageModel {

    loadModel = new PendingTaskModel();
    @observable.ref menuModel = null;
    dimChooserModel = new DimChooserModel({
        dimensions: ['Alpha', 'Beta', 'Gamma', 'Delta'],
        initialValue: ['Gamma'],
        historyPreference: 'mobileDimHistory'
    });

    gridModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'name', 'pnl']
        }),
        sortBy: 'pnl|desc|abs',
        columns: [
            {
                headerName: 'Name',
                field: 'name',
                isTreeColumn: true,
                flex: true
            },
            {
                headerName: 'P&L',
                field: 'pnl',
                align: 'right',
                width: 120,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: numberRenderer({precision: 0, ledger: true, colorSpec: true})
            }
        ]
    });

    constructor() {
        XH.portfolioService
            .getPortfolioAsync(['trader', 'sector', 'symbol'])
            .then(data => this.gridModel.loadData(data));

        this.addReaction({
            track: () => this.dimChooserModel.menuModel,
            run: (menuModel) => {
                this.menuModel = menuModel;
            },
            fireImmediately: true
        });
    }

    destroy() {
        XH.safeDestroy(this.gridModel);
        XH.safeDestroy(this.loadModel);
        XH.safeDestroy(this.menuModel);
    }

}