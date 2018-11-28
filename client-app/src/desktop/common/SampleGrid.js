import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {boolCheckCol, emptyFlexCol} from '@xh/hoist/cmp/grid/columns';
import {box, filler, span} from '@xh/hoist/cmp/layout';
import {elemFactory, HoistComponent, LayoutSupport, XH} from '@xh/hoist/core';
import {LocalStore} from '@xh/hoist/data';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {StoreContextMenu} from '@xh/hoist/desktop/cmp/contextmenu';
import {select, switchInput} from '@xh/hoist/desktop/cmp/form';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeCountLabel, storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/columns';
import {millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {Component} from 'react';

@HoistComponent
@LayoutSupport
class SampleGrid extends Component {

    @observable groupBy = false;

    loadModel = new PendingTaskModel();

    viewDetailsAction = {
        text: 'View Details',
        icon: Icon.search(),
        tooltip: 'View details on the selected company',
        recordsRequired: 1,
        actionFn: ({record}) => this.showInfoToast(record)
    };

    terminateAction = {
        text: 'Terminate',
        icon: Icon.skull(),
        intent: 'danger',
        tooltip: 'Terminate this company.',
        recordsRequired: 1,
        actionFn: ({record}) => this.showTerminateToast(record),
        displayFn: ({record}) => {
            if (record.city == 'New York') {
                return {
                    disabled: true,
                    tooltip: 'New York companies cannot be terminated at this time.'
                };
            }
        }
    };

    localModel = new GridModel({
        store: new LocalStore({
            fields: ['id', 'company', 'active', 'city', 'trade_volume', 'profit_loss']
        }),
        selModel: {mode: 'multiple'},
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

    constructor(props) {
        super(props);
        this.loadAsync();
    }

    render() {
        const {model} = this,
            selection = model.selection,
            selCount = selection.length;

        let selText = 'None';
        if (selCount == 1) {
            selText = `${selection[0].company} (${selection[0].city})` ;
        } else if (selCount > 1) {
            selText = `${selCount} companies`;
        }

        return panel({
            item: grid({model}),
            mask: this.loadModel,
            tbar: toolbar({
                omit: this.props.omitToolbar,
                items: [
                    refreshButton({model: this}),
                    toolbarSep(),
                    span('Group by:'),
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
                    toolbarSep(),
                    switchInput({
                        model,
                        field: 'compact',
                        label: 'Compact',
                        labelAlign: 'left'
                    }),
                    filler(),
                    storeCountLabel({gridModel: model, unit: 'companies'}),
                    storeFilterField({gridModel: model}),
                    colChooserButton({gridModel: model}),
                    exportButton({model, exportType: 'excel'})
                ]
            }),
            bbar: toolbar({
                items: [
                    Icon.info(),
                    box(`Current selection: ${selText}`)
                ]
            }),
            className: this.getClassName(),
            ...this.getLayoutProps()
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
