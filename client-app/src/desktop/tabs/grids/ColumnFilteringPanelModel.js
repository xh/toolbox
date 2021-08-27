import {XH, HoistModel, managed} from '@xh/hoist/core';
import {GridModel, localDateCol, ExportFormat} from '@xh/hoist/cmp/grid';
import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';

export class ColumnFilteringPanelModel extends HoistModel {

    @managed gridModel;
    @managed filterChooserModel;

    constructor() {
        super();
        this.gridModel = this.createGridModel();
        this.filterChooserModel = this.createFilterChooserModel();
    }

    async doLoadAsync(loadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'}),
            {gridModel} = this;

        gridModel.loadData(trades);
    }

    createGridModel() {
        return new GridModel({
            showSummary: 'bottom',
            selModel: {mode: 'multiple'},
            sortBy: 'profit_loss|desc|abs',
            emptyText: 'No records found...',
            filterModel: true,
            colChooserModel: true,
            enableExport: true,
            exportOptions: {
                columns: ['id', 'company', 'VISIBLE'],
                filename: 'hoist-sample-export'
            },
            store: {
                idEncodesTreePath: true,
                freezeData: false,
                fieldDefaults: {disableXssProtection: true},
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
            colDefaults: {filterable: true},
            columns: [
                {
                    field: 'id',
                    hidden: true
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
                    field: 'trade_date',
                    ...localDateCol,
                    width: 150,
                    chooserDescription: 'Date of last trade (including related derivatives)'
                }
            ]
        });
    }

    createFilterChooserModel() {
        const {store} = this.gridModel;
        return new FilterChooserModel({
            bind: store,
            fieldSpecs: [
                'active',
                'company',
                'city',
                'trade_date',
                {field: 'profit_loss', valueRenderer: numberRenderer({precision: 0})},
                {field: 'trade_volume', valueRenderer: millionsRenderer({precision: 1, label: true})}
            ]
        });
    }
}
