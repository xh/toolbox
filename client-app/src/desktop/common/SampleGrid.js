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
import {grid, GridModel, colChooserButton} from '@xh/hoist/cmp/grid';
import {storeFilterField, storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {StoreContextMenu} from '@xh/hoist/desktop/cmp/contextmenu';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {switchInput, select} from '@xh/hoist/desktop/cmp/form';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {boolCheckCol, emptyFlexCol} from '@xh/hoist/cmp/grid/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {observable, action} from '@xh/hoist/mobx';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/columns';

@HoistComponent
@LayoutSupport
class SampleGrid extends Component {

    loadModel = new PendingTaskModel();

    viewDetailsAction = {
        text: 'View Details',
        icon: Icon.search(),
        tooltip: 'View details on the selected company',
        actionFn: ({record}) => this.showInfoToast(record)
    };

    terminateAction = {
        text: 'Terminate',
        icon: Icon.skull(),
        intent: 'danger',
        tooltip: 'Terminate this company.',
        actionFn: ({record}) => this.showTerminateToast(record)
    };

    localModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'company', 'active', 'city', 'trade_volume', 'profit_loss']
        }),
        sortBy: 'profit_loss|desc|abs',
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        contextMenuFn: () => {
            return new StoreContextMenu({
                items: [
                    this.viewDetailsAction,
                    this.terminateAction,
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
                hidden: true
            },
            {
                ...actionCol,
                width: calcActionColWidth(2),
                actionsShowOnHoverOnly: true,
                actions: [
                    this.viewDetailsAction,
                    this.terminateAction
                ]
            },
            {
                field: 'company',
                width: 200,
                tooltip: true
            },
            {
                field: 'city',
                width: 150,
                tooltip: (val, rec) => `${rec.company} is located in ${val}`
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
                absSort: true,
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true,
                    tooltip: true
                })
            },
            {
                field: 'active',
                ...boolCheckCol,
                headerName: '',
                chooserName: 'Active Status',
                tooltip: (active, rec) => active ? `${rec.company} is active` : ''
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
        const {model} = this;

        return panel({
            className: this.getClassName(),
            ...this.getLayoutProps(),
            item: grid({model}),
            mask: this.loadModel,
            bbar: toolbar({
                omit: this.props.omitToolbar,
                items: [
                    storeFilterField({gridModel: model}),
                    storeCountLabel({
                        gridModel: model,
                        unit: 'companies'
                    }),
                    filler(),
                    box('Group by:'),
                    select({
                        model: this,
                        field: 'groupBy',
                        options: [
                            {value: 'active', label: 'Active'},
                            {value: 'city', label: 'City'},
                            {value: false, label: 'None'}
                        ],
                        width: 120,
                        enableFilter: false
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
            .then(() => this.model.loadData(XH.tradeService.generateTrades()))
            .linkTo(this.loadModel);
    }

    showInfoToast(rec) {
        XH.toast({
            message: `You asked for ${rec.company} details. They are based in ${rec.city}.`,
            icon: Icon.info(),
            intent: 'primary'
        });
    }

    showTerminateToast(rec) {
        XH.toast({
            message: `You asked to terminate ${rec.company}. Sorry, ${rec.company}!`,
            icon: Icon.skull(),
            intent: 'danger'
        });
    }

    @action
    setGroupBy(groupBy) {
        this.groupBy = groupBy;
        this.model.setGroupBy(groupBy);
    }

}

export const sampleGrid = elemFactory(SampleGrid);
