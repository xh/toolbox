/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, LayoutSupport, XH} from '@xh/hoist/core';
import {filler} from '@xh/hoist/cmp/layout';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {storeFilterField, storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/form';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {emptyFlexCol} from '@xh/hoist/cmp/grid/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {DimensionChooserModel, dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';

@HoistComponent
@LayoutSupport
class SampleTreeGrid extends Component {

    loadModel = new PendingTaskModel();

    dimChooserModel = new DimensionChooserModel({
        dimensions: [
            {value: 'region', label: 'Region'},
            {value: 'sector', label: 'Sector'},
            {value: 'symbol', label: 'Symbol'}
        ],
        initialValue: ['sector', 'symbol']
    });

    model = new GridModel({
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

    constructor(props) {
        super(props);
        this.addReaction({
            track: () => this.dimChooserModel.value,
            run: () => this.loadAsync(),
            fireImmediately: true
        });
    }

    render() {
        const {model} = this;

        return panel({
            tbar: toolbar(
                dimensionChooser({
                    model: this.dimChooserModel
                })
            ),
            item: grid({model}),
            mask: this.loadModel,
            bbar: toolbar(
                refreshButton({model: this}),
                toolbarSep(),
                switchInput({
                    model,
                    field: 'compact',
                    label: 'Compact',
                    labelAlign: 'left'
                }),
                filler(),
                storeCountLabel({gridModel: model, units: 'companies'}),
                storeFilterField({gridModel: model}),
                colChooserButton({gridModel: model}),
                exportButton({model, exportOptions: {type: 'excelTable'}})
            ),
            className: this.getClassName(),
            ...this.getLayoutProps()
        });
    }

    //------------------------
    // Implementation
    //------------------------
    loadAsync() {
        const {model, loadModel, dimChooserModel} = this,
            dims = dimChooserModel.value;

        return XH.portfolioService
            .getPortfolioAsync(dims)
            .then(data => model.loadData(data))
            .linkTo(loadModel);
    }
}
export const sampleTreeGrid = elemFactory(SampleTreeGrid);
