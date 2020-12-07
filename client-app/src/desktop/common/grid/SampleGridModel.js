import {createRef} from 'react';
import {boolCheckCol, ExportFormat, GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {br, div, filler, fragment, hbox, vbox} from '@xh/hoist/cmp/layout';
import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/cmp/grid';
import {fmtDate, fmtMillions, fmtNumber, fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
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
        displayFn: ({record}) => record ? {tooltip: `View details for ${record.data.company}`} : null,
        actionFn: ({record}) => this.showInfoToast(record)
    };

    terminateAction = {
        text: 'Terminate',
        icon: Icon.skull({className: 'xh-red'}),
        intent: 'danger',
        tooltip: 'Terminate this company.',
        recordsRequired: 1,
        actionFn: ({record}) => this.showTerminateToast(record),
        displayFn: ({record}) => {
            if (!record) return null;
            if (record.data.city === 'New York') {
                return {
                    disabled: true,
                    tooltip: 'New York companies cannot be terminated at this time.'
                };
            }

            return {
                tooltip: `Terminate ${record.data.company}`
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
                tooltip: 'Try this first.',
                recordsRequired: 1,
                items: [
                    {
                        text: 'over Lunch',
                        tooltip: 'This will send a lunch invitation to their CEO.',
                        recordsRequired: 1,
                        actionFn: ({record}) => this.showTerminateToast(record, 'friendly merger proposal during lunch')
                    },
                    {
                        text: 'at Golf',
                        tooltip: 'This will send a golf outing invitation to their CEO.',
                        recordsRequired: 1,
                        actionFn: ({record}) => this.showTerminateToast(record, 'friendly merger proposal during golf')
                    }
                ]
            }
        ]
    };

    @managed
    gridModel = new GridModel({
        showSummary: 'bottom',
        selModel: {mode: 'multiple'},
        sortBy: 'profit_loss|desc|abs',
        emptyText: 'No records found...',
        colChooserModel: true,
        enableExport: true,
        exportOptions: {
            columns: ['id', 'company', 'VISIBLE'],
            filename: 'hoist-sample-export'
        },
        sizingMode: XH.appModel.gridSizingMode,
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
                    name: 'profit_loss',
                    displayName: 'P&L',
                    type: 'number'
                },
                {
                    name: 'trade_date',
                    displayName: 'Date',
                    type: 'localDate'
                },
                {
                    name: 'trade_volume',
                    headerName: 'Volume (Sales Quantity)',
                    type: 'number'
                }
            ]
        },
        contextMenu: [
            this.viewDetailsAction,
            this.terminateAction,
            '-',
            ...GridModel.defaultContextMenu
        ],
        groupSortFn: (a, b, groupField) => {
            if (a == b) return 0;
            if (groupField === 'winLose') {
                return a === 'Winner' ? -1 : 1;
            } else {
                return a < b ? -1 : 1;
            }
        },
        colDefaults: {
            tooltipElement: (v, {record, gridModel}) => {
                if (record.isSummary) return null;
                const {company, city, trade_date, profit_loss, trade_volume} = record.data;
                return vbox({
                    className: 'sample-grid-tooltip',
                    items: [
                        div({className: 'company', item: company}),
                        hbox({
                            className: 'city-and-date tooltip-row',
                            items: [
                                city,
                                filler(),
                                fmtDate(trade_date)
                            ]
                        }),
                        hbox({
                            className: 'tooltip-row',
                            items: [
                                'P&L',
                                filler(),
                                fmtNumber(profit_loss, {precision: 0, ledger: true, colorSpec: true, asElement: true})
                            ]
                        }),
                        hbox({
                            className: 'tooltip-row',
                            items: [
                                'Volume',
                                filler(),
                                fmtMillions(trade_volume, {precision: 1, label: true, asElement: true})
                            ]
                        })
                    ]
                });
            }
        },
        columns: [
            {
                field: 'id',
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
                flex: 2,
                minWidth: 200,
                maxWidth: 350,
                headerName: ({gridModel}) => {
                    let ret = 'Company';
                    if (gridModel.selectedRecord) {
                        ret += ` (${gridModel.selectedRecord.data.company})`;
                    }

                    return ret;
                },
                exportName: 'Company',
                headerTooltip: 'Select a company & continue'
            },
            {
                field: 'winLose',
                hidden: true,
                excludeFromChooser: true
            },
            {
                field: 'city',
                minWidth: 150,
                maxWidth: 200,
                tooltip: (val, {record}) => `${record.data.company} is located in ${val}`,
                cellClass: (val) => {
                    return val === 'New York' ? 'xh-text-color-accent' : '';
                }
            },
            {
                field: 'trade_volume',
                width: 110,
                tooltip: (val) => fmtNumberTooltip(val),
                renderer: millionsRenderer({
                    precision: 1,
                    label: true
                }),
                exportFormat: ExportFormat.NUM_DELIMITED
            },
            {
                field: 'profit_loss',
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
                field: 'trade_date',
                ...localDateCol
            },
            {
                field: 'active',
                ...boolCheckCol,
                headerName: '',
                chooserName: 'Active Status',
                tooltip: (active, {record}) => active ? `${record.data.company} is active` : ''
            }
        ]
    });

    async doLoadAsync(loadSpec) {
        const {trades, summary} = await XH.fetchJson({url: 'trade'}),
            gridModel = this.gridModel;

        gridModel.loadData(trades, summary);
        if (gridModel.isReady && !gridModel.hasSelection) gridModel.selectFirst();
    }

    showInfoToast(rec) {
        XH.toast({
            message: fragment(
                `You asked for ${rec.data.company} details.`, br(),
                `They are based in ${rec.data.city}.`
            ),
            icon: Icon.info(),
            intent: 'primary',
            containerRef: this.panelRef.current
        });
    }

    showTerminateToast(rec, terminationMethod = '') {
        if (terminationMethod) {
            terminationMethod = ' via ' + terminationMethod;
        }

        XH.toast({
            message: `You asked to terminate ${rec.data.company}${terminationMethod}. Sorry, ${rec.data.company}!`,
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
