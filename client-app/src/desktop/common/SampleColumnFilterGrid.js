/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, LayoutSupport, XH} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {storeFilterField, storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {StoreContextMenu} from '@xh/hoist/desktop/cmp/contextmenu';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep, toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {boolCheckCol, emptyFlexCol} from '@xh/hoist/cmp/grid/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {action, observable} from '@xh/hoist/mobx';

@HoistComponent
@LayoutSupport
class SampleColumnFilterGrid extends Component {

    @observable groupRows = false;

    loadModel = new PendingTaskModel();

    COL_FILTER_PROPS = {suppressMenu: false, suppressFilter: false, filterParams: {clearButton: true}};

    model = new GridModel({
        stateModel: 'toolboxColFilterGrid',
        store: new LocalStore({
            fields: [
                'firstName', 'lastName', 'city', 'state', 'salary', 'projectedUnitsSold',
                'projectedGross', 'actualUnitsSold', 'actualGross', 'retain'
            ]
        }),
        sortBy: 'lastName',
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
                        actionFn: ({record}) => this.showRecToast(record)
                    },
                    '-',
                    ...GridModel.defaultContextMenuTokens
                ],
                gridModel: this.model
            });
        },
        columns: [
            {
                field: 'firstName',
                headerName: 'First',
                width: 100,
                chooserName: 'First Name',
                agOptions: {filter: 'agTextColumnFilter', ...this.COL_FILTER_PROPS}
            },
            {
                field: 'lastName',
                headerName: 'Last',
                width: 100,
                chooserName: 'Last Name',
                agOptions: {filter: 'agTextColumnFilter', ...this.COL_FILTER_PROPS}
            },
            {
                field: 'state',
                width: 120,
                agOptions: {filter: 'agTextColumnFilter', ...this.COL_FILTER_PROPS}

            },
            {
                field: 'salary',
                width: 120,
                align: 'right',
                renderer: numberRenderer({precision: 0}),
                agOptions: {filter: 'agNumberColumnFilter', ...this.COL_FILTER_PROPS}
            },
            {
                field: 'actualUnitsSold',
                headerName: 'Units Sold',
                align: 'right',
                width: 120,
                agOptions: {filter: 'agNumberColumnFilter', ...this.COL_FILTER_PROPS}
            },
            {
                field: 'actualGross',
                headerName: 'Gross Sales',
                align: 'right',
                width: 120,
                renderer: numberRenderer({precision: 0}),
                agOptions: {filter: 'agNumberColumnFilter', ...this.COL_FILTER_PROPS}

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
            item: grid({
                model,
                agOptions: {
                    suppressMenuHide: false,
                    enableFilter: true,
                    onFilterChange: () => model.setRowCount(console.log('A'))
                }
            }),
            mask: this.loadModel,
            bbar: toolbar(
                filler(),
                // new label
                storeCountLabel({gridModel: model, unit: 'salesperson'}),
                storeFilterField({gridModel: model}),
                colChooserButton({gridModel: model}),
                exportButton({gridModel: model})
            ),
            className: this.getClassName(),
            ...this.getLayoutProps()
        });
    }

    //------------------------
    // Implementation
    //------------------------
    loadAsync() {
        wait(250)
            .then(() => this.model.loadData(XH.salesService.generateSales()))
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

    @action
    setGroupRows = (groupRows) => {
        this.groupRows = groupRows;
        this.model.setGroupBy(groupRows ? 'state' : null);
    };

}
export const sampleColumnFilterGrid = elemFactory(SampleColumnFilterGrid);
