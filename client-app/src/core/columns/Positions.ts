import {millionsRenderer, numberRenderer, fmtNumberTooltip} from '@xh/hoist/format';
import {ColumnSpec} from '@xh/hoist/cmp/grid';

export const mktValCol: ColumnSpec = {
    field: {name: 'mktVal', type: 'number'},
    headerName: 'Mkt Value (m)',
    headerTooltip: 'Market value (in millions USD)',
    align: 'right',
    width: 130,
    absSort: true,
    agOptions: {aggFunc: 'sum'},
    tooltip: val => fmtNumberTooltip(val, {ledger: true}),
    renderer: millionsRenderer({
        precision: 3,
        ledger: true
    })
};

export const pnlCol: ColumnSpec = {
    field: {name: 'pnl', type: 'number'},
    headerName: 'P&L',
    align: 'right',
    width: 130,
    absSort: true,
    agOptions: {aggFunc: 'sum'},
    tooltip: val => fmtNumberTooltip(val, {ledger: true}),
    renderer: numberRenderer({
        precision: 0,
        ledger: true,
        colorSpec: true
    })
};
