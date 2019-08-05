import {calendarDateCol, boolCheckCol, emptyFlexCol, grid, gridCountLabel, GridModel} from '@xh/hoist/cmp/grid';
import {ExportFormat} from '@xh/hoist/cmp/grid/columns';
import {br, filler, fragment, hbox, hframe, span, vframe} from '@xh/hoist/cmp/layout';
import {elemFactory, HoistComponent, HoistModel, LayoutSupport, LoadSupport, managed, XH} from '@xh/hoist/core';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {StoreContextMenu} from '@xh/hoist/desktop/cmp/contextmenu';
import {actionCol, calcActionColWidth} from '@xh/hoist/desktop/cmp/grid';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {action, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {Ref} from '@xh/hoist/utils/react';
import PT from 'prop-types';
import {Component} from 'react';

import {gridStyleSwitches} from './GridStyleSwitches';

import './SampleGrid.scss';

@HoistComponent
@LayoutSupport
class SampleGrid extends Component {

    static propTypes = {
        externalLoadModel: PT.instanceOf(PendingTaskModel),

        /**
         * True to drop grid-example-specific toolbars/controls - for use when embedding the grid
         * within other examples where such controls would be distracting.
         */
        omitGridTools: PT.bool
    };

    baseClassName = 'tbox-samplegrid';
    model;

    constructor(props) {
        super(props);
        this.model = new Model({loadModel: props.externalLoadModel});
    }

    render() {
        const {model, props} = this,
            {gridModel, loadModel} = model,
            {selection} = gridModel,
            selCount = selection.length;

        let selText;
        switch (selCount) {
            case 0: selText = 'No selection'; break;
            case 1: selText = `Selected ${selection[0].company}`; break;
            default: selText = `Selected ${selCount} companies`;
        }

        return panel({
            items: [
                hframe(
                    vframe(
                        grid({model: gridModel}),
                        hbox({
                            items: [Icon.info(), selText],
                            className: 'tbox-samplegrid__selbar',
                            omit: props.omitGridTools
                        })
                    ),
                    panel({
                        title: 'Display Options',
                        icon: Icon.settings(),
                        className: 'tbox-display-opts',
                        compactHeader: true,
                        items: gridStyleSwitches({gridModel}),
                        omit: props.omitGridTools,
                        model: {side: 'right', defaultSize: 170, resizable: false}
                    })
                )
            ],
            tbar: toolbar({
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
                    gridCountLabel({gridModel, unit: 'companies'}),
                    storeFilterField({gridModel}),
                    colChooserButton({gridModel}),
                    exportButton({gridModel})
                ],
                omit: props.omitGridTools
            }),
            ref: model.panelRef.ref,
            mask: props.externalLoadModel ? false : loadModel,
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

    constructor({loadModel}) {
        if (loadModel) {
            this._loadModel = loadModel;
        }
    }

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
