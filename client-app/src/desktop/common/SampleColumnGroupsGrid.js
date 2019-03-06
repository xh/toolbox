/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistModel, HoistComponent, LoadSupport, LayoutSupport, managed, XH} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {grid, GridModel, boolCheckCol, emptyFlexCol} from '@xh/hoist/cmp/grid';
import {storeFilterField, storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {StoreContextMenu} from '@xh/hoist/desktop/cmp/contextmenu';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep, toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {action, observable} from '@xh/hoist/mobx';

@HoistComponent
@LayoutSupport
class SampleColumnGroupsGrid extends Component {

    model = new Model();

    render() {
        const {model} = this,
            {gridModel, loadModel} = model;

        return panel({
            item: grid({model: gridModel}),
            mask: loadModel,
            bbar: toolbar(
                refreshButton({model}),
                toolbarSep(),
                switchInput({
                    model: gridModel,
                    bind: 'groupRows',
                    label: 'Group rows:',
                    labelAlign: 'left'
                }),
                toolbarSep(),
                switchInput({
                    model: gridModel,
                    bind: 'compact',
                    label: 'Compact mode:',
                    labelAlign: 'left'
                }),
                filler(),
                storeCountLabel({gridModel, unit: 'salesperson'}),
                storeFilterField({gridModel}),
                colChooserButton({gridModel}),
                exportButton({gridModel})
            ),
            className: this.getClassName(),
            ...this.getLayoutProps()
        });
    }
}
export const sampleColumnGroupsGrid = elemFactory(SampleColumnGroupsGrid);


@HoistModel
@LoadSupport
class Model {

    @observable groupRows = false;

    @managed
    gridModel = new GridModel({
        stateModel: 'toolboxGroupGrid',
        store: new LocalStore({
            fields: [
                'firstName', 'lastName', 'city', 'state', 'salary', 'projectedUnitsSold',
                'projectedGross', 'actualUnitsSold', 'actualGross', 'retain'
            ],
            idSpec: rec => `${rec.firstName}~${rec.lastName}~${rec.city}~${rec.state}`
        }),
        sortBy: 'lastName',
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        compact: XH.appModel.useCompactGrids,
        contextMenuFn: () => {
            return new StoreContextMenu({
                items: [
                    {
                        text: 'View Details',
                        icon: Icon.search(),
                        recordsRequired: 1,
                        actionFn: ({record}) => this.showRecToast(record)
                    },
                    '-',
                    ...GridModel.defaultContextMenuTokens
                ],
                gridModel: this.gridModel
            });
        },
        columns: [
            {
                headerName: 'Demographics',
                groupId: 'DEMO',
                children: [
                    {
                        field: 'firstName',
                        headerName: 'First',
                        width: 100,
                        chooserName: 'First Name'
                    },
                    {
                        field: 'lastName',
                        headerName: 'Last',
                        width: 100,
                        chooserName: 'Last Name'
                    },
                    {
                        field: 'city',
                        width: 120,
                        hidden: true
                    },
                    {
                        field: 'state',
                        width: 120
                    }
                ]
            },
            {
                field: 'salary',
                width: 90,
                align: 'right',
                renderer: numberRenderer({precision: 0})
            },
            {
                headerName: 'Sales',
                children: [
                    {
                        headerName: 'Projected',
                        children: [
                            {
                                field: 'projectedUnitsSold',
                                headerName: 'Units',
                                align: 'right',
                                width: 70,
                                chooserName: 'Projected Units',
                                exportName: 'Projected Units'
                            },
                            {
                                field: 'projectedGross',
                                headerName: 'Gross',
                                align: 'right',
                                width: 100,
                                renderer: numberRenderer({precision: 0}),
                                chooserName: 'Projected Gross',
                                exportName: 'Projected Gross'
                            }
                        ]
                    },
                    {
                        headerName: 'Actual',
                        children: [
                            {
                                field: 'actualUnitsSold',
                                headerName: 'Units',
                                align: 'right',
                                width: 70,
                                chooserName: 'Actual Units',
                                exportName: 'Actual Units'
                            },
                            {
                                field: 'actualGross',
                                headerName: 'Gross',
                                align: 'right',
                                width: 110,
                                renderer: numberRenderer({precision: 0}),
                                chooserName: 'Actual Gross',
                                exportName: 'Actual Gross'
                            }
                        ]
                    }
                ]
            },
            {
                field: 'retain',
                ...boolCheckCol,
                width: 70
            },
            {...emptyFlexCol}
        ]
    });

    //------------------------
    // Implementation
    //------------------------
    async doLoadAsync(loadSpec) {
        return wait(250)
            .then(() => this.gridModel.loadData(XH.salesService.generateSales()));
    }

    showRecToast(rec) {
        XH.alert({
            title: `${rec.firstName} ${rec.lastName}`,
            message: `You asked to see details for ${rec.firstName}. They sold ${rec.actualUnitsSold} last year.`,
            confirmText: 'Close',
            confirmIntent: 'primary'
        });
    }

    @action
    setGroupRows = (groupRows) => {
        this.groupRows = groupRows;
        this.gridModel.setGroupBy(groupRows ? 'state' : null);
    };
}