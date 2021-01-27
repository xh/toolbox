/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2020 Extremely Heavy Industries Inc.
 */
import {boolCheckCol, grid, gridCountLabel, GridModel} from '@xh/hoist/cmp/grid';
import {filler, hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {StoreContextMenu} from '@xh/hoist/desktop/cmp/contextmenu';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtMillions, fmtNumber, numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, observable, makeObservable} from '@xh/hoist/mobx';
import {createRef} from 'react';
import {gridOptionsPanel} from './options/GridOptionsPanel';

export const sampleColumnGroupsGrid = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model, ...props}) {
        const {gridModel} = model;

        return panel({
            item: hframe(grid(), gridOptionsPanel({model: gridModel})),
            ref: model.panelRef,
            mask: 'onLoad',
            tbar: [
                refreshButton(),
                toolbarSep(),
                switchInput({
                    bind: 'groupRows',
                    label: 'Group rows:',
                    labelAlign: 'left'
                }),
                toolbarSep(),
                switchInput({
                    bind: 'inMillions',
                    label: 'Gross in millions:',
                    labelAlign: 'left'
                }),
                filler(),
                gridCountLabel(),
                storeFilterField(),
                colChooserButton(),
                exportButton()
            ],
            ...props
        });
    }
});

class Model extends HoistModel {

    @managed gridModel;
    @observable groupRows;
    @bindable inMillions = false;

    panelRef = createRef();

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = this.createGridModel();
        this.setGroupRows(true);

        this.addReaction({
            track: () => this.inMillions,
            run: () => {
                this.gridModel.agApi.refreshCells({
                    columns: ['projectedGross', 'actualGross'],
                    force: true
                });
            }
        });
    }


    //------------------------
    // Implementation
    //------------------------
    createGridModel() {
        const unitColOpts = {
            headerName: 'Units',
            align: 'right',
            width: 70,
            renderer: numberRenderer({precision: 0})
        };

        const grossColOpts = {
            headerName: () => 'Gross' + (this.inMillions ? ' (m)' : ''),
            align: 'right',
            width: 100,
            rendererIsComplex: true,
            // Note this renderer will *not* auto-refresh just because the model observable changes.
            // To ensure the grid redraws these cells, we add a custom reaction in our model ctor.
            renderer: (v) => {
                return this.inMillions ?
                    fmtMillions(v, {label: true, precision: 2}) :
                    fmtNumber(v, {precision: 0});
            }
        };

        return new GridModel({
            persistWith: {localStorageKey: 'toolboxGroupGrid'},
            store: {
                idSpec: data => `${data.firstName}~${data.lastName}~${data.city}~${data.state}`
            },
            sortBy: 'lastName',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            sizingMode: XH.appModel.gridSizingMode,
            contextMenu: () => {
                return new StoreContextMenu({
                    items: [
                        {
                            text: 'View Details',
                            icon: Icon.search(),
                            recordsRequired: 1,
                            actionFn: ({record}) => this.showRecToast(record)
                        },
                        '-',
                        ...GridModel.defaultContextMenu
                    ],
                    gridModel: this.gridModel
                });
            },
            columns: [
                {
                    groupId: 'demographics',
                    children: [
                        {
                            colId: 'fullName',
                            headerName: 'Name',
                            width: 140,
                            chooserName: 'Full Name',
                            renderer: (v, {record}) => record ? `${record.data.firstName} ${record.data.lastName}` : '',
                            rendererIsComplex: true,
                            agOptions: {
                                columnGroupShow: 'closed'
                            }
                        },
                        {
                            field: 'firstName',
                            headerName: 'First',
                            width: 100,
                            chooserName: 'First Name',
                            agOptions: {
                                columnGroupShow: 'open'
                            }
                        },
                        {
                            field: 'lastName',
                            headerName: 'Last',
                            width: 100,
                            chooserName: 'Last Name',
                            agOptions: {
                                columnGroupShow: 'open'
                            }
                        },
                        {
                            field: 'city',
                            width: 120,
                            hidden: true,
                            agOptions: {
                                columnGroupShow: 'open'
                            }
                        },
                        {
                            field: 'state',
                            width: 120,
                            agOptions: {
                                columnGroupShow: 'open'
                            }
                        }
                    ]
                },
                {
                    field: 'salary',
                    width: 90,
                    align: 'right',
                    renderer: numberRenderer({precision: 0, prefix: '$'})
                },
                {
                    groupId: 'sales',
                    headerName: () => 'Sales' + (this.inMillions ? ' (in millions)' : ''),
                    headerAlign: 'center',
                    children: [
                        {
                            groupId: 'projected',
                            headerAlign: 'center',
                            headerClass: 'xh-blue',
                            children: [
                                {
                                    field: 'projectedUnitsSold',
                                    chooserName: 'Projected Units',
                                    exportName: 'Projected Units',
                                    ...unitColOpts
                                },
                                {
                                    field: 'projectedGross',
                                    chooserName: 'Projected Gross',
                                    exportName: 'Projected Gross',
                                    ...grossColOpts
                                }
                            ]
                        },
                        {
                            groupId: 'actual',
                            headerAlign: 'center',
                            headerClass: 'xh-red',
                            children: [
                                {
                                    field: 'actualUnitsSold',
                                    chooserName: 'Actual Units',
                                    exportName: 'Actual Units',
                                    ...unitColOpts
                                },
                                {
                                    field: 'actualGross',
                                    chooserName: 'Actual Gross',
                                    exportName: 'Actual Gross',
                                    ...grossColOpts
                                }
                            ]
                        }
                    ]
                },
                {
                    field: 'retain',
                    ...boolCheckCol,
                    width: 70
                }
            ]
        });
    }

    async doLoadAsync(loadSpec) {
        const sales = await XH.fetchJson({url: 'sales'});
        this.gridModel.loadData(sales);
    }

    showRecToast(rec) {
        const {firstName, lastName, actualUnitsSold} = rec.data;
        XH.toast({
            title: `${firstName} ${lastName}`,
            message: `You asked to see details for ${firstName}. They sold ${actualUnitsSold} last year.`,
            intent: 'primary',
            containerRef: this.panelRef.current
        });
    }

    @action
    setGroupRows = (groupRows) => {
        this.groupRows = groupRows;
        this.gridModel.setGroupBy(groupRows ? 'state' : null);
    };
}
