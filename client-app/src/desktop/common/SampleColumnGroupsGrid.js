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
import {switchField} from '@xh/hoist/desktop/cmp/form';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {boolCheckCol, emptyFlexCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer, millionsRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {mask} from '@xh/hoist/desktop/cmp/mask';
import {App} from '../App';

@HoistComponent
@LayoutSupport
class SampleColumnGroupsGrid extends Component {

    loadModel = new PendingTaskModel();

    localModel = new GridModel({
        stateModel: 'toolboxGroupGrid',
        store: new LocalStore({
            fields: ['id', 'company', 'active', 'city', 'trade_volume', 'profit_loss', 'client', 'headquarters', 'employees']
        }),
        sortBy: [{colId: 'company', sort: 'asc'}],
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
                headerName: 'Demographics',
                groupId: 'DEMO',
                children: [
                    {
                        field: 'active',
                        ...boolCheckCol,
                        headerName: '',
                        chooserName: 'Active Status'
                    },
                    {
                        headerName: 'Company',
                        children: [
                            {
                                field: 'company',
                                colId: 'companyName',
                                width: 180
                            },
                            {
                                field: 'city',
                                colId: 'Storefront',
                                headerName: 'Storefront Loc',
                                width: 140
                            },
                            {
                                field: 'headquarters',
                                width: 140
                            },
                            {
                                field: 'employees',
                                align: 'right',
                                width: 110
                            }
                        ]
                    },
                    {
                        field: 'client',
                        ...boolCheckCol,
                        chooserName: 'Client',
                        width: 80
                    }
                ]
            },
            {
                headerName: 'Data',
                children: [
                    {
                        headerName: 'Trade Volume',
                        field: 'trade_volume',
                        align: 'right',
                        width: 130,
                        renderer: millionsRenderer({precision: 1, label: true})
                    },
                    {
                        headerName: 'P&L',
                        field: 'profit_loss',
                        align: 'right',
                        width: 130,
                        renderer: numberRenderer({precision: 0, ledger: true, colorSpec: true})
                    }
                ]
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
                        fields: ['company', 'city']
                    }),
                    storeCountLabel({
                        store,
                        units: 'companies'
                    }),
                    filler(),
                    box('Compact mode:'),
                    switchField({
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

}
export const sampleColumnGroupsGrid = elemFactory(SampleColumnGroupsGrid);
