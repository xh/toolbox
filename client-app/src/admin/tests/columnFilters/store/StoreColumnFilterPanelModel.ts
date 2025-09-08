import {FilterChooserModel} from '@xh/hoist/cmp/filter';
import {boolCheckCol, ExcelFormat, GridModel, localDateCol} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {CompoundFilter, FieldFilter} from '@xh/hoist/data';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {bindable, makeObservable} from '@xh/hoist/mobx';

export class StoreColumnFilterPanelModel extends HoistModel {
    @bindable.ref filterJson: string = JSON.stringify(null);

    @managed gridModel: GridModel;
    @managed filterChooserModel: FilterChooserModel;

    constructor() {
        super();
        makeObservable(this);

        this.gridModel = this.createGridModel();
        this.filterChooserModel = this.createFilterChooserModel();

        // Update filter JSON
        this.addReaction({
            track: () => this.gridModel.filterModel.filter as FieldFilter | CompoundFilter,
            run: filter => {
                this.filterJson = JSON.stringify(filter?.toJSON() ?? null, undefined, 2);
            }
        });
    }

    override async doLoadAsync(loadSpec) {
        const {gridModel} = this,
            {trades} = await XH.fetchJson({url: 'trade'});

        // Introduce null values to test 'blank' filters
        trades.forEach(trade => {
            if (trade.city === 'Boston') trade.city = null;
        });

        gridModel.loadData(trades);
        await gridModel.preSelectFirstAsync();
    }

    //--------------------
    // Grid Mode Implementation
    //--------------------
    private createGridModel() {
        return new GridModel({
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
                        displayName: 'Volume (Sales Quantity)',
                        type: 'number'
                    },
                    {
                        name: 'active',
                        type: 'bool'
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
                    field: 'active',
                    ...boolCheckCol,
                    headerName: '',
                    chooserName: 'Active Status',
                    tooltip: (active, {record}) =>
                        active ? `${record.data.company} is active` : ''
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
                    cellClass: val => {
                        return val === 'New York' ? 'xh-text-color-accent' : '';
                    }
                },
                {
                    field: 'trade_volume',
                    width: 150,
                    tooltip: val => fmtNumberTooltip(val),
                    renderer: millionsRenderer({
                        precision: 1,
                        label: true
                    }),
                    excelFormat: ExcelFormat.NUM_DELIMITED,
                    chooserDescription: 'Daily Volume of Shares (Estimated, avg. YTD)'
                },
                {
                    field: 'profit_loss',
                    width: 150,
                    absSort: true,
                    tooltip: val => fmtNumberTooltip(val, {ledger: true}),
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true,
                        colorSpec: true
                    }),
                    excelFormat: ExcelFormat.LEDGER_COLOR,
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

    private createFilterChooserModel() {
        const {store} = this.gridModel;
        return new FilterChooserModel({
            bind: store,
            fieldSpecs: [
                'active',
                'company',
                'city',
                'trade_date',
                {field: 'profit_loss', valueRenderer: numberRenderer({precision: 0})},
                {
                    field: 'trade_volume',
                    valueRenderer: millionsRenderer({precision: 1, label: true})
                }
            ]
        });
    }
}
