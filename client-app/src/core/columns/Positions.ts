import {millionsRenderer, numberRenderer, fmtNumberTooltip} from '@xh/hoist/format';
import type {ColumnSpec} from '@xh/hoist/cmp/grid';

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

export const dayPnlCol: ColumnSpec = {
    field: {name: 'dayPnl', type: 'number'},
    headerName: 'Day P&L',
    headerTooltip: 'P&L since market open',
    align: 'right',
    width: 120,
    absSort: true,
    tooltip: val => fmtNumberTooltip(val, {ledger: true}),
    renderer: numberRenderer({
        precision: 0,
        ledger: true,
        colorSpec: true
    })
};

export const longMktValCol: ColumnSpec = {
    ...mktValCol,
    field: {name: 'longMktVal', type: 'number'},
    headerName: 'Long (m)',
    headerTooltip: 'Market value of long positions (in millions USD)',
    width: 110
};

export const shortMktValCol: ColumnSpec = {
    ...mktValCol,
    field: {name: 'shortMktVal', type: 'number'},
    headerName: 'Short (m)',
    headerTooltip: 'Market value of short positions (in millions USD)',
    width: 110
};

export const costCol: ColumnSpec = {
    ...mktValCol,
    field: {name: 'cost', type: 'number'},
    headerName: 'Cost Basis (m)',
    headerTooltip: 'Total cost of all orders (in millions USD)'
};

export const commissionCol: ColumnSpec = {
    field: {name: 'commission', type: 'number'},
    headerName: 'Commission',
    headerTooltip: 'Total commission paid on all orders (USD)',
    align: 'right',
    width: 120,
    tooltip: val => fmtNumberTooltip(val),
    renderer: numberRenderer({precision: 0})
};
