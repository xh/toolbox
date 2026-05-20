import {ExcelFormat, localDateCol} from '@xh/hoist/cmp/grid';
import {dateRenderer, millionsRenderer, numberRenderer, fmtNumberTooltip} from '@xh/hoist/format';
import {ColumnSpec} from '@xh/hoist/cmp/grid';

export const profitLossCol: ColumnSpec = {
    field: {
        name: 'profit_loss',
        type: 'number',
        displayName: 'P&L',
        description: 'Annual Profit & Loss YTD (EBITDA)'
    },
    width: 130,
    align: 'right',
    absSort: true,
    tooltip: val => fmtNumberTooltip(val, {ledger: true}),
    renderer: numberRenderer({
        precision: 0,
        ledger: true,
        colorSpec: true
    }),
    excelFormat: ExcelFormat.LEDGER_COLOR
};

export const winLoseCol: ColumnSpec = {
    field: {name: 'winLose', type: 'string'},
    excludeFromChooser: true
};

export const tradeVolumeCol: ColumnSpec = {
    field: {
        name: 'trade_volume',
        type: 'number',
        displayName: 'Volume',
        description: 'Daily Volume of Shares (Estimated, avg. YTD)'
    },
    width: 110,
    align: 'right',
    tooltip: val => fmtNumberTooltip(val),
    renderer: millionsRenderer({
        precision: 1,
        label: true
    }),
    cellClassRules: {
        'tb-sample-grid__high-volume-cell': ({value}) => value >= 9000000000
    },
    excelFormat: ExcelFormat.NUM_DELIMITED
};

export const tradeDateCol: ColumnSpec = {
    ...localDateCol,
    field: {
        name: 'trade_date',
        type: 'localDate',
        displayName: 'Date',
        description: 'Date of last trade (including related derivatives)'
    }
};

export const dayOfWeekCol: ColumnSpec = {
    field: {
        name: 'trade_date',
        type: 'localDate'
    },
    colId: 'dayOfWeek',
    displayName: 'Day of Week',
    chooserDescription: 'Used for testing storeFilterField matching on rendered dates.',
    width: 130,
    renderer: dateRenderer({fmt: 'dddd'})
};
