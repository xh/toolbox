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
import {switchInput, select} from '@xh/hoist/desktop/cmp/form';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {boolCheckCol, emptyFlexCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {observable, action} from '@xh/hoist/mobx';
import {actionCol} from '@xh/hoist/desktop/columns';
import {RecordAction} from '@xh/hoist/cmp/record';

import {App} from '../App';

@HoistComponent
@LayoutSupport
class SampleGrid extends Component {

    loadModel = new PendingTaskModel();

    viewDetailsAction = new RecordAction({
        text: 'View Details',
        icon: Icon.search(),
        tooltip: 'View Company Details',
        recordsRequired: 1,
        actionFn: (item, rec) => this.showRecToast(rec)
    });

    localModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'company', 'active', 'city', 'trade_volume', 'profit_loss']
        }),
        sortBy: [{colId: 'company', sort: 'asc'}],
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        contextMenuFn: () => {
            return new StoreContextMenu({
                items: [
                    this.viewDetailsAction,
                    '-',
                    ...GridModel.defaultContextMenuTokens
                ],
                gridModel: this.model
            });
        },
        columns: [
            {
                field: 'id',
                headerName: 'ID',
                hide: true
            },
            {
                ...actionCol,
                actions: [
                    this.viewDetailsAction
                ]
            },
            {
                field: 'active',
                ...boolCheckCol,
                headerName: '',
                chooserName: 'Active Status'
            },
            {
                field: 'company',
                width: 200,
                tooltip: true
            },
            {
                field: 'city',
                width: 150,
                tooltip: (value, data, meta) => `${data.company} is located in ${data.city}`
            },
            {
                headerName: 'Trade Volume',
                field: 'trade_volume',
                align: 'right',
                width: 130,
                renderer: millionsRenderer({
                    precision: 1,
                    label: true,
                    tooltip: true
                })
            },
            {
                headerName: 'P&L',
                field: 'profit_loss',
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

    @observable groupBy = false;

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
                        fields: ['company', 'city']
                    }),
                    storeCountLabel({
                        store,
                        unit: 'companies'
                    }),
                    filler(),
                    box('Group by:'),
                    select({
                        options: [
                            {value: 'active', label: 'Active'},
                            {value: 'city', label: 'City'},
                            {value: false, label: 'None'}
                        ],
                        model: this,
                        field: 'groupBy'
                    }),
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
            .then(() => this.model.loadData(App.tradeService.generateTrades()))
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

    @action
    setGroupBy(groupBy) {
        this.groupBy = groupBy;
        this.model.setGroupBy(groupBy);
    }

}

export const sampleGrid = elemFactory(SampleGrid);
