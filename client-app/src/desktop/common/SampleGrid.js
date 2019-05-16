import {grid, GridModel, calendarDateCol, boolCheckCol, emptyFlexCol} from '@xh/hoist/cmp/grid';
import {box, filler, fragment, span, br} from '@xh/hoist/cmp/layout';
import {elemFactory, HoistComponent, LayoutSupport, XH, HoistModel, managed, LoadSupport} from '@xh/hoist/core';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {StoreContextMenu} from '@xh/hoist/desktop/cmp/contextmenu';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeCountLabel, storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/cmp/grid';
import {millionsRenderer, numberRenderer, fmtNumberTooltip} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {Component} from 'react';
import {truncate} from 'lodash';

import {gridStyleSwitches} from './GridStyleSwitches';
import {Ref} from '@xh/hoist/utils/react';

@HoistComponent
@LayoutSupport
class SampleGrid extends Component {

    model = new Model();

    render() {
        const {model} = this,
            {gridModel, loadModel} = model,
            {selection} = gridModel,
            selCount = selection.length;

        let selText = 'No selection';
        if (selCount == 1) {
            selText = truncate(selection[0].company, {length: 20});
        } else if (selCount > 1) {
            selText = `Selected ${selCount} companies`;
        }

        return panel({
            item: grid({model: gridModel}),
            ref: model.panelRef.ref,
            mask: loadModel,
            tbar: toolbar({
                omit: this.props.omitToolbar,
                items: [
                    refreshButton({model}),
                    toolbarSep(),
                    span('Group by:'),
                    select({
                        model,
                        bind: 'groupBy',
                        options: [
                            {value: 'city', label: 'City'},
                            {value: 'winLose', label: 'Win/Lose'},
                            {value: 'city,winLose', label: 'City › Win/Lose'},
                            {value: 'winLose,city', label: 'Win/Lose › City'},
                            {value: false, label: 'None'}
                        ],
                        width: 160,
                        enableFilter: false
                    }),
                    filler(),
                    storeCountLabel({gridModel, unit: 'companies'}),
                    storeFilterField({gridModel}),
                    colChooserButton({gridModel}),
                    exportButton({gridModel})
                ]
            }),
            bbar: toolbar({
                items: [
                    Icon.info(),
                    box(selText),
                    filler(),
                    gridStyleSwitches({gridModel})
                ]
            }),
            className: this.getClassName(),
            ...this.getLayoutProps()
        });
    }

}
export const sampleGrid = elemFactory(SampleGrid);


@HoistModel
@LoadSupport
class Model {
    @observable groupBy = false;

    panelRef = new Ref();

    viewDetailsAction = {
        text: 'View Details',
        icon: Icon.search(),
        tooltip: 'View details on the selected company',
        recordsRequired: 1,
        displayFn: ({record}) => ({tooltip: `View details for ${record.company}`}),
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

            return {
                tooltip: `Terminate ${record.company}`
            };
        }
    };

    @managed
    gridModel = new GridModel({
        selModel: {mode: 'multiple'},
        sortBy: 'profit_loss|desc|abs',
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        compact: XH.appModel.useCompactGrids,
        store: {
            processRawData: (r) => {
                const pnl = r.profit_loss;
                return {
                    winLose: pnl > 0 ? 'Winner' : (pnl < 0 ? 'Loser' : 'Flat'),
                    ...r
                };
            }
        },
        contextMenuFn: (params, gridModel) => {
            return new StoreContextMenu({
                items: [
                    this.viewDetailsAction,
                    this.terminateAction,
                    '-',
                    ...GridModel.defaultContextMenuTokens
                ],
                gridModel
            });
        },
        groupSortFn: (a, b, groupField) => {
            if (a == b) return 0;
            if (groupField == 'winLose') {
                return a == 'Winner' ? -1 : 1;
            } else {
                return a < b ? -1 : 1;
            }
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
                field: 'winLose',
                hidden: true,
                excludeFromChooser: true
            },
            {
                field: 'city',
                width: 150,
                tooltip: (val, {record}) => `${record.company} is located in ${val}`,
                cellClass: (val) => {
                    return val == 'New York' ? 'xh-text-color-accent' : '';
                }
            },
            {
                headerName: 'Trade Volume',
                field: 'trade_volume',
                align: 'right',
                width: 120,
                tooltip: (val) => fmtNumberTooltip(val),
                renderer: millionsRenderer({
                    precision: 1,
                    label: true
                })
            },
            {
                headerName: 'P&L',
                field: 'profit_loss',
                align: 'right',
                width: 130,
                absSort: true,
                tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true
                })
            },
            {
                headerName: 'Date',
                field: 'tradeDate',
                ...calendarDateCol
            },
            {
                field: 'active',
                ...boolCheckCol,
                headerName: '',
                chooserName: 'Active Status',
                tooltip: (active, {record}) => active ? `${record.company} is active` : ''
            },
            {...emptyFlexCol}
        ]
    });
    
    async doLoadAsync(loadSpec) {
        const gridModel = this.gridModel;
        return wait(250)
            .then(() => {
                gridModel.loadData(XH.tradeService.generateTrades());
                if (!gridModel.hasSelection) gridModel.selectFirst();
            });
    }

    showInfoToast(rec) {
        XH.toast({
            message: fragment(
                `You asked for ${rec.company} details.`, br(),
                `They are based in ${rec.city}.`
            ),
            icon: Icon.info(),
            intent: 'primary',
            containerRef: this.panelRef.value
        });
    }

    showTerminateToast(rec) {
        XH.toast({
            message: `You asked to terminate ${rec.company}. Sorry, ${rec.company}!`,
            icon: Icon.skull(),
            intent: 'danger',
            containerRef: this.panelRef.value
        });
    }

    @action
    setGroupBy(groupBy) {
        this.groupBy = groupBy;

        // Always select first when regrouping.
        const groupByArr = groupBy ? groupBy.split(',') : [];
        this.gridModel.setGroupBy(groupByArr);
        wait(1).then(() => this.gridModel.selectFirst());
    }
}
