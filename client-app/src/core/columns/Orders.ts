import {ColumnSpec, dateTime, localDate} from '@xh/hoist/cmp/grid';
import {fmtDate, fmtNumber, numberRenderer} from '@xh/hoist/format';

export const symbolCol: ColumnSpec = {
    field: {
        name: 'symbol',
        type: 'string',
        displayName: 'Instrument'
    },
    width: 100
};

export const traderCol: ColumnSpec = {
    field: {name: 'trader', type: 'string'},
    width: 140
};

export const fundCol: ColumnSpec = {
    field: {name: 'fund', type: 'string'},
    width: 160
};

export const modelCol: ColumnSpec = {
    field: {name: 'model', type: 'string'},
    width: 160
};

export const regionCol: ColumnSpec = {
    field: {name: 'region', type: 'string'},
    width: 160
};

export const sectorCol: ColumnSpec = {
    field: {name: 'sector', type: 'string'},
    width: 160
};

export const dirCol: ColumnSpec = {
    field: {
        name: 'dir',
        type: 'string',
        displayName: 'Direction'
    },
    headerName: 'B/S',
    headerTooltip: 'Direction (Buy/Sell)',
    align: 'center',
    width: 60
};

export const quantityCol: ColumnSpec = {
    field: {name: 'quantity', type: 'number'},
    width: 100,
    renderer: numberRenderer({precision: 0, ledger: true})
};

export const priceCol: ColumnSpec = {
    field: {name: 'price', type: 'number'},
    width: 80,
    renderer: numberRenderer({precision: 2})
};

export const orderExecTime: ColumnSpec = {
    ...dateTime,
    field: {
        name: 'time',
        type: 'date',
        displayName: 'Exec Time'
    },
    align: 'left'
};

export const orderExecDay: ColumnSpec = {
    ...localDate,
    field: {
        name: 'day',
        type: 'localDate',
        displayName: 'Exec Day'
    },
    align: 'left'
};

export const closingPriceSparklineCol: ColumnSpec = {
    field: {
        name: 'closingPrices',
        type: 'json',
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
                tooltip: {
                    renderer: ({xValue, yValue}) => ({
                        title: fmtDate(xValue, {fmt: 'MM/DD/YYYY'}),
                        content: fmtNumber(yValue)
                    })
                }
            }
        }
    }
};
