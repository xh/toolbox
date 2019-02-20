/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {managed, XH, HoistModel, LoadSupport} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {DimensionChooserModel} from '@xh/hoist/mobile/cmp/dimensionchooser';

@HoistModel
@LoadSupport
export class TreeGridPageModel {

    @managed
    dimensionChooserModel = new DimensionChooserModel({
        dimensions: [
            {value: 'fund', label: 'Fund'},
            {value: 'model', label: 'Model'},
            {value: 'region', label: 'Region'},
            {value: 'sector', label: 'Sector'},
            {value: 'symbol', label: 'Symbol'},
            {value: 'trader', label: 'Trader'}
        ],
        initialValue: ['trader'],
        historyPreference: 'mobileDimHistory'
    });

    @managed
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
        this.addReaction({
            track: () => this.dimensionChooserModel.value,
            run: this.loadAsync,
            fireImmediately: true
        });
    }

    async doLoadAsync(loadSpec) {
        const dims = this.dimensionChooserModel.value;
        return XH.portfolioService
            .getPortfolioAsync(dims, 800)
            .then(data => {
                this.gridModel.loadData(data);
            });
    }
}