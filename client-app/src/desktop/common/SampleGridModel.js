import {createRef} from 'react';
import {localDateCol, boolCheckCol, emptyFlexCol, GridModel} from '@xh/hoist/cmp/grid';
import {ExportFormat} from '@xh/hoist/cmp/grid/columns';
import {fragment, br} from '@xh/hoist/cmp/layout';
import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {StoreContextMenu} from '@xh/hoist/desktop/cmp/contextmenu';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/cmp/grid';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';

import './SampleGrid.scss';

@HoistModel
@LoadSupport
export class SampleGridModel {
    @observable groupBy = false;

    panelRef = createRef();

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
        },
        items: [
            {
                text: 'via Hostile Takeover',
                tooltip: 'This will send an aggressive sounding hostile takeover letter to their board.',
                recordsRequired: 1,
                actionFn: ({record}) => this.showTerminateToast(record, 'hostile takeover')
            },
            {
                text: 'via Friendly Merger Proposal',
                tooltip: 'This will send a dinner invitation to their CEO.',
                recordsRequired: 1,
                actionFn: ({record}) => this.showTerminateToast(record, 'friendly merger proposal')
            }
        ]
    };

    @managed
    gridModel = new GridModel({
        showSummary: 'bottom',
        selModel: {mode: 'multiple'},
        sortBy: 'profit_loss|desc|abs',
        emptyText: 'No records found...',
        enableColChooser: true,
        enableExport: true,
        exportOptions: {
            columns: ['id', 'company', 'VISIBLE'],
            filename: 'hoist-sample-export'
        },
        compact: XH.appModel.useCompactGrids,
        store: {
            processRawData: (r) => {
                const pnl = r.profit_loss;
                return {
                    winLose: pnl > 0 ? 'Winner' : (pnl < 0 ? 'Loser' : 'Flat'),
                    ...r
                };
            },
            fields: [
                {
                    name: 'trade_date',
                    type: 'localDate'
                }]
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
                tooltip: true,
                headerName: ({gridModel}) => {
                    let ret = 'Company';
                    if (gridModel.selectedRecord) {
                        ret += ` (${gridModel.selectedRecord.company})`;
                    }

                    return ret;
                }
            },
            {
                field: 'winLose',
                hidden: true,
                excludeFromChooser: true
            },
            {
                field: 'city',
                width: 140,
                tooltip: (val, {record}) => `${record.company} is located in ${val}`,
                cellClass: (val) => {
                    return val == 'New York' ? 'xh-text-color-accent' : '';
                }
            },
            {
                headerName: 'Volume',
                field: 'trade_volume',
                align: 'right',
                width: 110,
                tooltip: (val) => fmtNumberTooltip(val),
                renderer: millionsRenderer({
                    precision: 1,
                    label: true
                }),
                exportFormat: ExportFormat.NUM_DELIMITED
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
                }),
                exportFormat: ExportFormat.LEDGER_COLOR
            },
            {
                headerName: 'Date',
                field: 'trade_date',
                ...localDateCol
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
        const {trades, summary} = await XH.fetchJson({url: 'trade'}),
            gridModel = this.gridModel;

        gridModel.loadData(trades, summary);
        if (!gridModel.hasSelection) gridModel.selectFirst();
    }

    showInfoToast(rec) {
        XH.toast({
            message: fragment(
                `You asked for ${rec.company} details.`, br(),
                `They are based in ${rec.city}.`
            ),
            icon: Icon.info(),
            intent: 'primary',
            containerRef: this.panelRef.current
        });
    }

    showTerminateToast(rec, terminationMethod) {
        if (terminationMethod) {
            terminationMethod = ' via ' + terminationMethod;
        }

        XH.toast({
            message: `You asked to terminate ${rec.company}${terminationMethod}. Sorry, ${rec.company}!`,
            icon: Icon.skull(),
            intent: 'danger',
            containerRef: this.panelRef.current
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
