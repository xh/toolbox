import {XH, HoistModel, managed, LoadSpec, PlainObject} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {GridModel, localDateCol, ExcelFormat} from '@xh/hoist/cmp/grid';
import {fmtNumberTooltip, millionsRenderer, numberRenderer} from '@xh/hoist/format';

export class ExternalSortGridPanelModel extends HoistModel {
    @managed gridModel: GridModel;
    @bindable.ref trades: PlainObject[];
    @bindable maxRows: number = null;

    constructor() {
        super();
        makeObservable(this);

        this.gridModel = this.createGridModel();

        this.addReaction({
            track: () => [this.trades, this.maxRows, this.gridModel.sortBy],
            run: () => this.sortAndLoadGridAsync()
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'});
        this.trades = trades;
    }

    //------------------------
    // Implementation
    //------------------------
    createGridModel(): GridModel {
        return new GridModel({
            externalSort: true,
            sortBy: 'profit_loss|desc|abs',
            emptyText: 'No records found...',
            colChooserModel: true,
            enableExport: true,
            exportOptions: {
                columns: ['id', 'company', 'VISIBLE'],
                filename: 'hoist-sample-export'
            },
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
                    cellClass: val => {
                        return val === 'New York' ? 'xh-text-color-accent' : '';
                    }
                },
                {
                    field: {
                        name: 'trade_volume',
                        type: 'number',
                        displayName: 'Volume',
                        description: 'Daily Volume of Shares (Estimated, avg. YTD)'
                    },
                    width: 150,
                    tooltip: val => fmtNumberTooltip(val),
                    renderer: millionsRenderer({
                        precision: 1,
                        label: true
                    }),
                    excelFormat: ExcelFormat.NUM_DELIMITED
                },
                {
                    field: {
                        name: 'profit_loss',
                        type: 'number',
                        displayName: 'P&L',
                        description: 'Annual Profit & Loss YTD (EBITDA)'
                    },
                    width: 150,
                    absSort: true,
                    tooltip: val => fmtNumberTooltip(val, {ledger: true}),
                    renderer: numberRenderer({
                        precision: 0,
                        ledger: true,
                        colorSpec: true
                    }),
                    excelFormat: ExcelFormat.LEDGER_COLOR
                },
                {
                    field: {
                        name: 'trade_date',
                        type: 'localDate',
                        displayName: 'Date',
                        description: 'Date of last trade (including related derivatives)'
                    },
                    ...localDateCol,
                    width: 150
                }
            ]
        });
    }

    async sortAndLoadGridAsync(): Promise<void> {
        const {trades, maxRows, gridModel} = this,
            {sortBy} = gridModel;

        let data = [...trades];

        // Sort according to GridModel.sortBy[]
        sortBy.forEach(it => {
            const compFn = it.comparator.bind(it),
                direction = it.sort === 'desc' ? -1 : 1;

            data.sort((a, b) => compFn(a[it.colId], b[it.colId]) * direction);
        });

        // Limit sorted rows by maxRows
        if (maxRows) {
            data = data.slice(0, maxRows);
        }

        gridModel.loadData(data);
        await gridModel.preSelectFirstAsync();
    }
}
