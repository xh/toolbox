import {HoistModel, managed, XH} from '@xh/hoist/core';
import {boolCheckCol, ExportFormat, GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {
    dateRenderer,
    fmtNumberTooltip,
    millionsRenderer,
    numberRenderer
} from '@xh/hoist/format';

export class ColumnFilterPanelModel extends HoistModel {

    @bindable.ref
    jsonFilterInput = JSON.stringify(null);

    get filter() {
        return this.gridModel.store.filter;
    }

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
                },
                {
                    name: 'active',
                    type: 'bool'
                }
            ]
        },
        colDefaults: {
            enableFilter: true
        },
        columns: [
            {
                field: 'id',
                hidden: true
            },
            {
                field: 'active',
                ...boolCheckCol,
                headerName: '',
                chooserName: 'Active Status',
                tooltip: (active, {record}) => active ? `${record.data.company} is active` : ''
            },
            {
                field: 'company',
                flex: 1,
                minWidth: 200,
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
                width: 150,
                tooltip: (val) => fmtNumberTooltip(val),
                renderer: millionsRenderer({
                    precision: 1,
                    label: true
                }),
                exportFormat: ExportFormat.NUM_DELIMITED,
                chooserDescription: 'Daily Volume of Shares (Estimated, avg. YTD)'
            },
            {
                field: 'profit_loss',
                width: 150,
                absSort: true,
                tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
                renderer: numberRenderer({
                    precision: 0,
                    ledger: true,
                    colorSpec: true
                }),
                exportFormat: ExportFormat.LEDGER_COLOR,
                chooserDescription: 'Annual Profit & Loss YTD (EBITDA)'
            },
            {
                colId: 'dayOfWeek',
                field: 'trade_date',
                displayName: 'Day of Week',
                chooserDescription: 'Used for testing storeFilterField matching on rendered dates.',
                width: 150,
                hidden: true,
                renderer: dateRenderer({fmt: 'dddd'})
            },
            {
                field: 'trade_date',
                ...localDateCol,
                width: 150,
                chooserDescription: 'Date of last trade (including related derivatives)'
            }
        ]
    });

    constructor() {
        super();
        makeObservable(this);

        this.addReaction({
            track: () => this.filter,
            run: (filter) => this.setJsonFilterInput(JSON.stringify(filter?.toJSON() ?? null, undefined, 2))
        });
    }

    async doLoadAsync(loadSpec) {
        const {trades, summary} = await XH.fetchJson({url: 'trade'}),
            {gridModel} = this;

        gridModel.loadData(trades, summary);
        await gridModel.preSelectFirstAsync();
    }

}
