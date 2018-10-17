/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {isEmpty} from 'lodash';
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
import {toolbarSep, toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {boolCheckCol, emptyFlexCol} from '@xh/hoist/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {App} from '../App';

@HoistComponent
@LayoutSupport
class SampleColumnGroupsGrid extends Component {

    loadModel = new PendingTaskModel();

    localModel = new GridModel({
        stateModel: 'toolboxGroupGrid',
        store: new LocalStore({
            fields: ['firstName', 'lastName', 'city', 'state', 'salary', 'projectedUnitsSold', 'projectedGross', 'actualUnitsSold', 'actualGross', 'retain']
        }),
        sortBy: [{colId: 'lastName', sort: 'asc'}],
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
                        actionFn: (item, rec) => this.showRecToast(rec)
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
                        unit: 'salesperson'
                    }),
                    filler(),
                    box('Group rows:'),
                    switchInput({
                        value: !isEmpty(model.groupBy),
                        onChange: (groupRows) => model.setGroupBy(groupRows ? ['state'] : null)
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
            .then(() => this.model.loadData(App.salesService.generateSales()))
            .linkTo(this.loadModel);
    }

    showRecToast(rec) {
        XH.alert({
            title: `${rec.firstName} ${rec.lastName}`,
            message: `You asked to see details for ${rec.firstName}. They sold ${rec.actualUnitsSold} last year.`,
            confirmText: 'Close',
            confirmIntent: 'primary'
        });
    }

}
export const sampleColumnGroupsGrid = elemFactory(SampleColumnGroupsGrid);
