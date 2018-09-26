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
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/form';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {emptyFlexCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';


import {sampleTreeData} from './SampleTreeData';

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
            .then(() => this.model.loadData(sampleTreeData))
            .linkTo(this.loadModel);
    }
}
export const sampleTreeGrid = elemFactory(SampleTreeGrid);
