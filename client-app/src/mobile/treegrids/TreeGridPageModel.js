/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2020 Extremely Heavy Industries Inc.
 */
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {GridModel} from '@xh/hoist/cmp/grid';
import {millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {DimensionChooserModel} from '@xh/hoist/mobile/cmp/dimensionchooser';

export class TreeGridPageModel extends HoistModel {

    @managed
    dimensionChooserModel = new DimensionChooserModel({
        dimensions: ['fund', 'model', 'region', 'sector', 'symbol', 'trader'],
        initialValue: ['sector', 'symbol'],
        initialHistory: [
            ['sector', 'symbol'],
            ['fund', 'trader'],
            ['fund', 'trader', 'sector', 'symbol'],
            ['region']
        ],
        persistWith: {localStorageKey: 'toolboxTreeGridSample'}
    });

    @managed
    gridModel = new GridModel({
        treeMode: true,
        showSummary: true,
        store: {
            loadRootAsSummary: true
        },
        colChooserModel: true,
        sortBy: 'pnl|desc|abs',
        columns: [
            {
                headerName: 'Name',
                field: 'name',
                isTreeColumn: true,
                flex: true
            },
            {
                headerName: 'Mkt Value (m)',
                chooserName: 'Market Value',
                field: 'mktVal',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: millionsRenderer({
                    precision: 3,
                    ledger: true
                })
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
        super();
        this.addReaction({
            track: () => this.dimensionChooserModel.value,
            run: () => this.loadAsync()
        });
    }

    async doLoadAsync(loadSpec) {
        const dims = this.dimensionChooserModel.value;
        const data = await XH.portfolioService.getPositionsAsync(dims, true);
        this.gridModel.loadData(data);
    }
}
