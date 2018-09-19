/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, LayoutSupport, XH} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {box, filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
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
                    {
                        text: 'View Details',
                        icon: Icon.search(),
                        recordsRequired: 1,
                        action: (item, rec) => this.showRecToast(rec)
                    },
                    '-',
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
        this.model.setGroupBy(this.props.groupBy);
        this.loadAsync();
    }

    render() {
        const {model} = this,
            {store} = model;

        return panel({
            className: this.getClassName(),
            ...this.getLayoutProps(),
            item: grid({model}),
            mask: mask({spinner: true, model: this.loadModel}),
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

    showRecToast(rec) {
        XH.alert({
            title: rec.company,
            message: `You asked to see details for ${rec.company}. They are based in ${rec.city}.`,
            confirmText: 'Close',
            confirmIntent: 'primary'
        });
    }

    sampleData() {
        return [
            {
                name: 'Market Hawk',
                pnl: 50000,
                children: [
                    {
                        name: 'Equity',
                        pnl: 10000,
                        children: [
                            {name: 'goog', pnl: 15000},
                            {name: 'msft', pnl: -5000}
                        ]
                    },
                    {
                        name: 'Currency',
                        pnl: 40000,
                        children: [
                            {name: 'yen', pnl: 20000},
                            {name: 'eur', pnl: 20000}
                        ]
                    }]
            },
            {
                name: 'Icy Hot',
                pnl: -80000,
                children: [
                    {
                        name: 'Equity',
                        pnl: -100000,
                        children: [
                            {name: 'tsla', pnl: -150000},
                            {name: 'amzn', pnl: 50000}
                        ]
                    },
                    {
                        name: 'Currency',
                        pnl: 20000,
                        children: [
                            {name: 'gbp', pnl: 10000},
                            {name: 'peso', pnl: 10000}
                        ]
                    }]
            }];
    }
}
export const sampleTreeGrid = elemFactory(SampleTreeGrid);
