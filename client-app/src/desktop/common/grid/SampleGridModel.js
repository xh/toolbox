import {createRef} from 'react';
import {GridModel} from '@xh/hoist/cmp/grid';
import {br, div, filler, fragment, hbox, vbox} from '@xh/hoist/cmp/layout';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {FieldType} from '@xh/hoist/data';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/cmp/grid';
import {fmtDate, fmtMillions, fmtNumber} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, observable, makeObservable} from '@xh/hoist/mobx';
import './SampleGrid.scss';
import {
    activeCol,
    companyCol,
    winLoseCol,
    cityCol,
    tradeVolumeCol,
    profitLossCol,
    dayOfWeekCol,
    tradeDateCol
} from '../../../core/columns';

export class SampleGridModel extends HoistModel {

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
        selModel: {mode: 'multiple'},
        sortBy: 'profit_loss|desc|abs',
        emptyText: 'No records found...',
        colChooserModel: true,
        enableExport: true,
        exportOptions: {
            columns: ['id', 'company', 'VISIBLE'],
            filename: 'hoist-sample-export'
        },
        store: {
            processRawData: (r) => {
                const {id, active, city, company, profit_loss, trade_date, trade_volume} = r;
                return {
                    id,
                    active,
                    info: {
                        city,
                        company
                    },
                    financial: {
                        profit_loss,
                        trade_date,
                        trade_volume,
                        winLose: profit_loss > 0 ? 'Winner' : (profit_loss < 0 ? 'Loser' : 'Flat')
                    }
                };
            }
        },
        contextMenu: [
            this.viewDetailsAction,
            this.terminateAction,
            '-',
            ...GridModel.defaultContextMenu
        ],
        groupSortFn: (a, b, groupField) => {
            if (a === b) return 0;
            if (groupField === 'winLose') {
                return a === 'Winner' ? -1 : 1;
            } else {
                return a < b ? -1 : 1;
            }
        },
        colDefaults: {
            tooltipElement: (v, {record}) => {
                if (record.isSummary) return null;
                const {company, city, trade_date, profit_loss, trade_volume} = record.data;
                return vbox({
                    className: 'tb-sample-grid-tooltip',
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
            {field: 'id', hidden: true},
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
                ...companyCol,
                field: {
                    name: 'info.company',
                    displayName: 'Company',
                    type: FieldType.STRING
                },
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
                ...winLoseCol,
                field: {
                    name: 'financial.winLose',
                    type: FieldType.STRING
                },
                hidden: true
            },
            {
                ...cityCol,
                field: {
                    name: 'info.city',
                    type: FieldType.STRING
                },
                tooltip: (val, {record}) => `${record.data.company} is located in ${val}`
            },
            {
                ...tradeVolumeCol,
                field: {
                    name: 'financial.trade_volume',
                    type: FieldType.NUMBER,
                    displayName: 'Volume'
                }
            },
            {
                ...profitLossCol,
                field: {
                    name: 'financial.profit_loss',
                    type: FieldType.NUMBER,
                    displayName: 'P&L'
                }
            },
            {...dayOfWeekCol, hidden: true},
            {
                ...tradeDateCol,
                field: {
                    name: 'financial.trade_date',
                    type: FieldType.LOCAL_DATE,
                    displayName: 'Date'
                }
            },
            {...activeCol, tooltip: (active, {record}) => active ? `${record.data.company} is active` : ''}
        ]
    });

    constructor() {
        super();
        makeObservable(this);
    }

    async doLoadAsync(loadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'}),
            {gridModel} = this;

        gridModel.loadData(trades);
        await gridModel.preSelectFirstAsync();
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
        this.gridModel.preSelectFirstAsync();
    }
}
