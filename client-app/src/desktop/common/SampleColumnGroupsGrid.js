/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {boolCheckCol, emptyFlexCol, grid, gridCountLabel, GridModel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistModel, LoadSupport, managed, creates, XH} from '@xh/hoist/core';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {StoreContextMenu} from '@xh/hoist/desktop/cmp/contextmenu';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, observable} from '@xh/hoist/mobx';
import {createRef} from 'react';
import {getLayoutProps} from '@xh/hoist/utils/react';
import {gridStyleSwitches} from './GridStyleSwitches';

export const sampleColumnGroupsGrid = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model, className, ...props}) {
        return panel({
            item: grid(),
            ref: model.panelRef,
            mask: model.loadModel,
            tbar: toolbar(
                refreshButton(),
                toolbarSep(),
                switchInput({
                    bind: 'groupRows',
                    label: 'Group rows:',
                    labelAlign: 'left'
                }),
                filler(),
                gridCountLabel(),
                storeFilterField(),
                colChooserButton(),
                exportButton()
            ),
            bbar: toolbar(
                filler(),
                gridStyleSwitches({forToolbar: true})
            ),
            className,
            ...getLayoutProps(props)
        });
    }
});

@HoistModel
@LoadSupport
class Model {

    panelRef = createRef();

    @managed
    gridModel = new GridModel({
        stateModel: 'toolboxGroupGrid',
        store: {
            idSpec: rec => `${rec.firstName}~${rec.lastName}~${rec.city}~${rec.state}`
        },
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

    @observable
    groupRows = (this.gridModel.groupBy && this.gridModel.groupBy.length > 0);

    //------------------------
    // Implementation
    //------------------------
    async doLoadAsync(loadSpec) {
        const sales = await XH.fetchJson({url: 'sales'});

        this.gridModel.loadData(sales);
    }

    showRecToast(rec) {
        XH.toast({
            title: `${rec.firstName} ${rec.lastName}`,
            message: `You asked to see details for ${rec.firstName}. They sold ${rec.actualUnitsSold} last year.`,
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