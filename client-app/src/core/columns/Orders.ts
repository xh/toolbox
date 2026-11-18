import type {ColumnSpec} from '@xh/hoist/cmp/grid';
import {dateTime, localDate} from '@xh/hoist/cmp/grid';
import {div, span} from '@xh/hoist/cmp/layout';
import {sparkline} from '@xh/hoist/cmp/sparkline';
import {fmtDate, fmtNumber, fmtPercent, numberTextRenderer} from '@xh/hoist/format';
import {first, isEmpty, last, map} from 'lodash';
import type {ReactElement, ReactNode} from 'react';

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
    textRenderer: numberTextRenderer({precision: 0, ledger: true})
};

export const priceCol: ColumnSpec = {
    field: {name: 'price', type: 'number'},
    width: 80,
    textRenderer: numberTextRenderer({precision: 2})
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

/**
 * A Hoist `Sparkline` of an instrument's recent closing prices, colored by trend. The field holds
 * `[date, price]` pairs, as `PortfolioService.getSparklineSeriesAsync` returns them.
 */
export const closingPriceSparklineCol: ColumnSpec = {
    field: {
        name: 'closingPrices',
        type: 'json',
        displayName: '30D Close'
    },
    sortable: false,
    autosizable: false,
    width: 100,
    renderer: (series: Array<[Date, number]>) =>
        sparkline({
            data: map(series, 1),
            width: '100%',
            colorBy: 'trend',
            tooltip: () => closingPriceTip(series)
        })
};

/**
 * The AG Grid sparkline over the same closing prices, with a tooltip per point on a time axis.
 * Kept beside the Hoist `Sparkline` column in its demo, for comparison.
 */
export const closingPriceAgSparklineCol: ColumnSpec = {
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

//------------------
// Implementation
//------------------
/** The dates covered, then the first and last close and the change between them. */
function closingPriceTip(series: Array<[Date, number]>): ReactElement {
    if (isEmpty(series)) return null;
    const [startDate, start] = first(series),
        [endDate, end] = last(series);
    return div({
        className: 'tb-closing-price-tip',
        children: [
            div({
                className: 'tb-closing-price-tip__title',
                children: [fmtDate(startDate, 'MMM D'), ' to ', fmtDate(endDate, 'MMM D')]
            }),
            span('First'),
            tipValue(fmtNumber(start, {precision: 2})),
            span('Last'),
            tipValue(fmtNumber(end, {precision: 2})),
            span('Change'),
            tipValue(
                fmtPercent((end - start) / start, {
                    precision: 1,
                    colorSpec: true,
                    withSignGlyph: true
                })
            )
        ]
    });
}

function tipValue(value: ReactNode): ReactElement {
    return span({className: 'tb-closing-price-tip__value', children: value});
}
