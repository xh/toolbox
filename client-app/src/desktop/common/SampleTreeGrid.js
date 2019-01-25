/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, HoistModel, LayoutSupport, RefreshSupport, XH, managed} from '@xh/hoist/core';
import {filler} from '@xh/hoist/cmp/layout';
import {grid, GridModel, emptyFlexCol} from '@xh/hoist/cmp/grid';
import {storeFilterField, storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep, toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {DimensionChooserModel, dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';

@HoistComponent
@LayoutSupport
@RefreshSupport
class SampleTreeGrid extends Component {

    model = new Model();

    render() {
        const {model} = this,
            {gridModel} = model;

        return panel({
            tbar: toolbar(
                dimensionChooser({
                    model: model.dimChooserModel
                })
            ),
            item: grid({model: gridModel}),
            mask: model.loadModel,
            bbar: toolbar(
                refreshButton({model}),
                toolbarSep(),
                switchInput({
                    model: gridModel,
                    bind: 'compact',
                    label: 'Compact',
                    labelAlign: 'left'
                }),
                filler(),
                storeCountLabel({gridModel, units: 'companies'}),
                storeFilterField({gridModel}),
                colChooserButton({gridModel}),
                exportButton({gridModel})
            ),
            className: this.getClassName(),
            ...this.getLayoutProps()
        });
    }
}
export const sampleTreeGrid = elemFactory(SampleTreeGrid);


@HoistModel
class Model {
    @managed
    loadModel = new PendingTaskModel();

    @managed
    dimChooserModel = new DimensionChooserModel({
        dimensions: [
            {value: 'region', label: 'Region'},
            {value: 'sector', label: 'Sector'},
            {value: 'symbol', label: 'Symbol'}
        ],
        initialValue: ['sector', 'symbol']
    });

    @managed
    gridModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'name', 'pnl', 'mktVal']
        }),
        sortBy: 'pnl|desc|abs',
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        columns: [
            {
                headerName: 'Name',
                width: 200,
                field: 'name',
                isTreeColumn: true
            },
            {
                field: 'mktVal',
                headerName: 'Mkt Value (m)',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: millionsRenderer({
                    precision: 3,
                    ledger: true,
                    tooltip: true
                })
            },
            {
                headerName: 'P&L',
                field: 'pnl',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true,
                    tooltip: true
                })
            },
            {...emptyFlexCol}
        ]
    });

    constructor() {
        this.addReaction({
            track: () => this.dimChooserModel.value,
            run: this.loadAsync,
            fireImmediately: true
        });
    }

    loadAsync() {
        const {gridModel, loadModel, dimChooserModel} = this,
            dims = dimChooserModel.value;

        return XH.portfolioService
            .getPortfolioAsync(dims)
            .then(data => gridModel.loadData(data))
            .linkTo(loadModel);
    }
}

