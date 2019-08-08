/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {emptyFlexCol, grid, gridCountLabel, GridModel} from '@xh/hoist/cmp/grid';
import {filler, hframe} from '@xh/hoist/cmp/layout';
import {
    elemFactory,
    HoistComponent,
    HoistModel,
    LayoutSupport,
    LoadSupport,
    managed,
    XH
} from '@xh/hoist/core';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dimensionChooser, DimensionChooserModel} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon/Icon';
import {bindable} from '@xh/hoist/mobx';
import {Component} from 'react';

import {gridStyleSwitches} from './GridStyleSwitches';

@HoistComponent
@LayoutSupport
class SampleTreeGrid extends Component {

    model = new Model();

    render() {
        const {model} = this,
            {gridModel} = model;

        return panel({
            items: [
                hframe(
                    grid({model: gridModel}),
                    panel({
                        title: 'Display Options',
                        icon: Icon.settings(),
                        className: 'tbox-display-opts',
                        compactHeader: true,
                        items: gridStyleSwitches({gridModel}),
                        model: {side: 'right', defaultSize: 170, resizable: false}
                    })
                )
            ],
            tbar: toolbar(
                refreshButton({model}),
                toolbarSep(),
                dimensionChooser({
                    model: model.dimChooserModel
                }),
                filler(),
                gridCountLabel({gridModel, includeChildren: true}),
                storeFilterField({gridModel, filterOptions: {includeChildren: model.filterIncludeChildren}}),
                colChooserButton({gridModel}),
                exportButton({gridModel})
            ),
            mask: model.loadModel,
            bbar: toolbar(
                select({
                    model: gridModel,
                    bind: 'showSummary',
                    width: 130,
                    enableFilter: false,
                    options: [
                        {label: 'Top Total', value: 'top'},
                        {label: 'Bottom Total', value: 'bottom'},
                        {label: 'No Total', value: false}
                    ]
                }),
                toolbarSep(),
                switchInput({
                    model,
                    bind: 'filterIncludeChildren',
                    label: 'Filter w/Children',
                    labelAlign: 'left'
                })
            ),
            className: this.getClassName(),
            ...this.getLayoutProps()
        });
    }
}
export const sampleTreeGrid = elemFactory(SampleTreeGrid);


@HoistModel
@LoadSupport
class Model {

    @bindable
    filterIncludeChildren = false;
    
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
        store: {
            loadRootAsSummary: true
        },
        selModel: {mode: 'multiple'},
        sortBy: 'pnl|desc|abs',
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        compact: XH.appModel.useCompactGrids,
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
                headerTooltip: 'Market value (in millions USD)',
                align: 'right',
                width: 130,
                absSort: true,
                agOptions: {
                    aggFunc: 'sum'
                },
                tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                renderer: millionsRenderer({
                    precision: 3,
                    ledger: true
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
                tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true
                })
            },
            {...emptyFlexCol}
        ]
    });

    constructor() {
        // Load data when dimensions change
        this.addReaction({
            track: () => this.dimChooserModel.value,
            run: () => this.loadAsync()
        });

        // Bind dimensions to url parameter
        this.addReaction({
            track: () => XH.routerState,
            run: this.syncDimsToRouter,
            fireImmediately: true
        });

        this.addReaction({
            track: () => this.dimChooserModel.value,
            run: () => this.syncRouterToDims()
        });
    }

    async doLoadAsync(loadSpec) {
        const {gridModel, dimChooserModel} = this,
            dims = dimChooserModel.value;

        return XH.portfolioService
            .getPortfolioAsync(dims, true)
            .then(data => {
                gridModel.loadData(data);
                gridModel.selectFirst();
            });
    }

    syncDimsToRouter() {
        if (!XH.router.isActive('default.grids.tree')) return;

        const {dims} = XH.routerState.params;
        if (!dims) {
            this.syncRouterToDims({replace: true});
        } else {
            this.dimChooserModel.setValue(dims.split('.'));
        }
    }

    syncRouterToDims(opts) {
        if (!XH.router.isActive('default.grids.tree')) return;

        const {dimChooserModel} = this,
            dims = dimChooserModel.value.join('.');

        XH.navigate(XH.routerState.name, {dims}, opts);
    }
}

