import {fmtDate, fmtNumber, numberRenderer} from '@xh/hoist/format';
import {dateTimeCol} from '@xh/hoist/cmp/grid';
import {ColumnSpec} from '@xh/hoist/cmp/grid';

export const symbolCol = {
    field: {
        name: 'symbol',
        type: 'string',
        displayName: 'Instrument'
    },
    width: 100
} as ColumnSpec;

export const traderCol = {
    field: {name: 'trader', type: 'string'},
    width: 140
} as ColumnSpec;

export const fundCol = {
    field: {name: 'fund', type: 'string'},
    width: 160
} as ColumnSpec;

export const modelCol = {
    field: {name: 'model', type: 'string'},
    width: 160
} as ColumnSpec;

export const regionCol = {
    field: {name: 'region', type: 'string'},
    width: 160
} as ColumnSpec;

export const sectorCol = {
    field: {name: 'sector', type: 'string'},
    width: 160
} as ColumnSpec;

export const dirCol = {
    field: {
        name: 'dir',
        type: 'string',
        displayName: 'Direction'
    },
    headerName: 'B/S',
    headerTooltip: 'Direction (Buy/Sell)',
    align: 'center',
    width: 60
} as ColumnSpec;

export const quantityCol = {
    field: {name: 'quantity', type: 'number'},
    width: 100,
    renderer: numberRenderer({precision: 0, ledger: true})
} as ColumnSpec;

export const priceCol = {
    field: {name: 'price', type: 'number'},
    width: 80,
    renderer: numberRenderer({precision: 2})
} as ColumnSpec;

export const timeCol = {
    field: {
        name: 'time',
        type: 'date',
        displayName: 'Exec Time'
    },
    ...dateTimeCol,
    align: 'left'
} as ColumnSpec;

export const closingPriceSparklineCol = {
    field: {
        name: 'closingPrices',
        type: JSON,
        displayName: '30D Close'
    },
    sortable: false,
    autosizable: false,
    width: 100,
    agOptions: {
        cellRenderer: 'agSparklineCellRenderer',
        cellRendererParams: {
            sparklineOptions: {
                axis: {type: 'time'},
                crosshairs: {xLine: {enabled: false}},
                tooltip: {renderer: ({xValue, yValue}) => ({
                    title: fmtDate(xValue, {fmt: 'MM/DD/YYYY'}),
                    content: fmtNumber(yValue)
                })}
            }
        }
    }
} ;