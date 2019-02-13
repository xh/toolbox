/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, LayoutSupport, LoadSupport, XH, HoistModel, managed} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {filler, span} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {StoreContextMenu} from '@xh/hoist/desktop/cmp/contextmenu';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {colChooserButton, exportButton, button} from '@xh/hoist/desktop/cmp/button';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {emptyFlexCol} from '@xh/hoist/cmp/grid/columns';
import {LocalStore} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {action, observable, bindable} from '@xh/hoist/mobx';


@HoistComponent
@LayoutSupport
@LoadSupport
class SampleColumnFilterGrid extends Component {

    model = new Model();

    render() {
        const {model} = this,
            {gridModel, isAnyFilterPresent, loadModel, recordCount} = model,
            {agApi} = gridModel;

        return panel({
            item: grid({
                model: gridModel,
                agOptions: {
                    onFilterChanged: () => {
                        model.setIsAnyFilterPresent(agApi.isAnyFilterPresent());
                        model.setRecordCount(agApi.getDisplayedRowCount());
                    }
                }
            }),
            mask: loadModel,
            bbar: toolbar(
                span({
                    omit: recordCount === null,
                    item: `${recordCount} record(s)`
                }),
                button({
                    omit: !isAnyFilterPresent,
                    text: 'Clear Filters',
                    onClick: () => {
                        model.setIsAnyFilterPresent(false);
                        agApi.setFilterModel(null);
                    },
                    minimal: false
                }),
                filler(),
                colChooserButton({gridModel}),
                exportButton({gridModel})
            ),
            className: this.getClassName(),
            ...this.getLayoutProps()
        });
    }

}

export const sampleColumnFilterGrid = elemFactory(SampleColumnFilterGrid);


@HoistModel
class Model {

    @observable groupRows = false;

    @bindable recordCount = null;
    @bindable isAnyFilterPresent = null;

    @managed
    loadModel = new PendingTaskModel();

    COL_FILTER_PROPS = {suppressMenu: false, suppressFilter: false, filterParams: {clearButton: true}};

    @managed
    gridModel = new GridModel({
        stateModel: 'toolboxColFilterGrid',
        store: new LocalStore({
            fields: [
                'firstName', 'lastName', 'city', 'state', 'salary', 'projectedUnitsSold',
                'projectedGross', 'actualUnitsSold', 'actualGross', 'retain'
            ],
            idSpec: XH.genId
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


    //------------------------
    // Implementation
    //------------------------
    loadAsync() {
        return wait(250)
            .then(() => this.gridModel.loadData(XH.salesService.generateSales()))
            .then(() => this.setRecordCount(this.gridModel.store.count))
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
        this.gridModel.setGroupBy(groupRows ? 'state' : null);
    };
}
