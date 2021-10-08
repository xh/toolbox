import {FieldType} from '@xh/hoist/data';
import {ExportFormat, localDateCol} from '@xh/hoist/cmp/grid';
import {dateRenderer, millionsRenderer, numberRenderer, fmtNumberTooltip} from '@xh/hoist/format';

const {NUMBER, STRING, LOCAL_DATE} = FieldType;

export const profitLossCol = {
    field: {
        name: 'profit_loss',
        type: NUMBER,
        displayName: 'P&L'
    },
    width: 130,
    align: 'right',
    absSort: true,
    tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
    renderer: numberRenderer({
        precision: 0,
        ledger: true,
        colorSpec: true
    }),
    exportFormat: ExportFormat.LEDGER_COLOR,
    chooserDescription: 'Annual Profit & Loss YTD (EBITDA)'
};

export const winLoseCol = {
    field: {name: 'winLose', type: STRING},
    excludeFromChooser: true
};

export const tradeVolumeCol = {
    field: {
        name: 'trade_volume',
        type: NUMBER,
        displayName: 'Volume'
    },
    width: 110,
    align: 'right',
    tooltip: (val) => fmtNumberTooltip(val),
    renderer: millionsRenderer({
        precision: 1,
        label: true
    }),
    cellClassRules: {
        'tb-sample-grid__high-volume-cell': ({value}) => value >= 9000000000
    },
    exportFormat: ExportFormat.NUM_DELIMITED,
    chooserDescription: 'Daily Volume of Shares (Estimated, avg. YTD)'
};

export const tradeDateCol = {
    field: {
        name: 'trade_date',
        type: LOCAL_DATE,
        displayName: 'Date'
    },
    ...localDateCol,
    chooserDescription: 'Date of last trade (including related derivatives)'
};

export const dayOfWeekCol = {
    field: {
        name: 'trade_date',
        type: LOCAL_DATE
    },
    colId: 'dayOfWeek',
    displayName: 'Day of Week',
    chooserDescription: 'Used for testing storeFilterField matching on rendered dates.',
    width: 130,
    renderer: dateRenderer({fmt: 'dddd'})
};