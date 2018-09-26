/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, LayoutSupport} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {box, filler} from '@xh/hoist/cmp/layout';
import {grid, GridModel, colChooserButton} from '@xh/hoist/desktop/cmp/grid';
import {storeFilterField, storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {StoreContextMenu} from '@xh/hoist/desktop/cmp/contextmenu';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/form';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {emptyFlexCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {mask} from '@xh/hoist/desktop/cmp/mask';

@HoistComponent
@LayoutSupport
class SampleTreeGrid extends Component {

    loadModel = new PendingTaskModel();

    localModel = new GridModel({
        treeMode: true,
        store: new LocalStore({
            fields: ['id', 'name', 'pnl']
        }),
        sortBy: [{colId: 'name', sort: 'asc'}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        contextMenuFn: () => {
            return new StoreContextMenu({
                items: [
                    ...GridModel.defaultContextMenuTokens
                ],
                gridModel: this.model
            });
        },
        columns: [
            {
                headerName: 'Name',
                width: 200,
                field: 'name',
                isTreeColumn: true
            },
            {
                headerName: 'P&L',
                field: 'pnl',
                align: 'right',
                width: 130,
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
        this.loadAsync();
    }

    render() {
        const {model} = this,
            {store} = model;

        return panel({
            className: this.getClassName(),
            ...this.getLayoutProps(),
            item: grid({model}),
            mask: this.loadModel,
            bbar: toolbar({
                omit: this.props.omitToolbar,
                items: [
                    storeFilterField({
                        store,
                        fields: ['name']
                    }),
                    storeCountLabel({
                        store,
                        units: 'companies'
                    }),
                    filler(),
                    box('Compact mode:'),
                    switchInput({
                        field: 'compact',
                        model
                    }),
                    toolbarSep(),
                    colChooserButton({gridModel: model}),
                    exportButton({model, exportType: 'excel'}),
                    refreshButton({model: this})
                ]
            })
        });
    }

    //------------------------
    // Implementation
    //------------------------
    loadAsync() {
        wait(250)
            .then(() => this.model.loadData(this.sampleData()))
            .linkTo(this.loadModel);
    }

    sampleData() {
        return [
            {
                name: 'Market Hawk',
                id: '1',
                children: [
                    {
                        name: 'Equity',
                        id: '1a',
                        children: [
                            {id: '1a1', name: 'goog', pnl: 15000},
                            {id: '1a2', name: 'msft', pnl: -5000}
                        ]
                    },
                    {
                        name: 'Currency',
                        id: '1b',
                        children: [
                            {id: '1b1', name: 'yen', pnl: 20000},
                            {id: '1b2', name: 'eur', pnl: 20000}
                        ]
                    }]
            },
            {
                name: 'Icy Hot',
                id: '2',
                children: [
                    {
                        name: 'Equity',
                        id: '2a',
                        children: [
                            {id: '2a1', name: 'tsla', pnl: -150000},
                            {id: '2a2', name: 'amzn', pnl: 50000}
                        ]
                    },
                    {
                        name: 'Currency',
                        id: '2b',
                        children: [
                            {id: '2b1', name: 'gbp', pnl: 10000},
                            {id: '2b2', name: 'peso', pnl: 10000}
                        ]
                    }]
            }];
    }
}
export const sampleTreeGrid = elemFactory(SampleTreeGrid);
