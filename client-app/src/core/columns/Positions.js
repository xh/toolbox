import {FieldType} from '@xh/hoist/data';
import {millionsRenderer, numberRenderer, fmtNumberTooltip} from '@xh/hoist/format';

export const mktValCol = {
    field: {
        name: 'mktVal',
        type: FieldType.NUMBER
    },
    headerName: 'Mkt Value (m)',
    headerTooltip: 'Market value (in millions USD)',
    align: 'right',
    width: 130,
    absSort: true,
    agOptions: {aggFunc: 'sum'},
    tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
    renderer: millionsRenderer({
        precision: 3,
        ledger: true
    })
};

export const pnlCol = {
    field: {
        name: 'pnl',
        type: FieldType.NUMBER
    },
    headerName: 'P&L',
    align: 'right',
    width: 130,
    absSort: true,
    agOptions: {aggFunc: 'sum'},
    tooltip: (val) => fmtNumberTooltip(val, {ledger: true}),
    renderer: numberRenderer({
        precision: 0,
        ledger: true,
        colorSpec: true
    })
};