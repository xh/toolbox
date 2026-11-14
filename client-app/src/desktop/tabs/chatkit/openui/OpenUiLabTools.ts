import type {ChatToolSpec} from '@xh/hoist-chat-kit/core';
import {chatToolResult} from '@xh/hoist-chat-kit/core';
import type {ChatArtifact, ChatDataColumn} from '@xh/hoist-chat-kit/genui';
import type {PlainObject} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {
    countBy,
    first,
    groupBy,
    isEmpty,
    last,
    maxBy,
    meanBy,
    minBy,
    orderBy,
    pick,
    pickBy,
    round,
    sumBy,
    take,
    takeRight
} from 'lodash';
import type {PricedRawPosition} from '../../../../core/svc/PortfolioService';

/** The dimensions that Toolbox's sample positions and trades carry. */
export const PORTFOLIO_DIMS = ['symbol', 'sector', 'region', 'fund', 'model', 'trader'] as const;
export type PortfolioDim = (typeof PORTFOLIO_DIMS)[number];

/**
 * Client tools that give the lab's model real figures: the positions, trades and prices of
 * Toolbox's sample portfolio. Each tool keeps its rows in the browser as an artifact, and sends
 * the model the artifact's id, its columns, a summary and its first rows. The model then shows
 * the rows by reference, in a `DataGrid` or a `DataChart`, and never writes them out.
 *
 * Create one set per chat: artifact ids count up within the set.
 */
export function createOpenUiLabTools(): ChatToolSpec[] {
    const data = new PortfolioData();
    let artifactCount = 0;
    const nextId = (prefix: string) => `${prefix}-${++artifactCount}`;

    return [
        {
            name: 'query_positions',
            displayName: 'Query positions',
            description:
                'Total the positions of the sample portfolio by one or two dimensions, with ' +
                'optional filters. Returns the id of an artifact that holds a row per group, ' +
                'with its P&L, market value and number of positions. Group by symbol for ' +
                'single names.',
            icon: Icon.portfolio(),
            parameters: {
                type: 'object',
                required: ['groupBy'],
                additionalProperties: false,
                properties: {
                    groupBy: {
                        type: 'array',
                        minItems: 1,
                        maxItems: 2,
                        items: {type: 'string', enum: PORTFOLIO_DIMS},
                        description: 'The dimensions to total by.'
                    },
                    filter: dimFilterSchema(),
                    sortBy: {type: 'string', enum: ['pnl', 'mktVal', 'positions']},
                    sortDir: {type: 'string', enum: ['desc', 'asc']},
                    limit: {
                        type: 'integer',
                        minimum: 1,
                        maximum: MAX_ROWS,
                        description: `Most groups to return, after sorting. Default ${MAX_ROWS}.`
                    }
                }
            },
            summary: ({input}) => (input?.groupBy ? `by ${input.groupBy.join(', ')}` : null),
            execute: async ({groupBy: dims, filter, sortBy = 'pnl', sortDir = 'desc', limit}) => {
                const positions = applyDimFilter(await data.getPositionsAsync(), filter),
                    groups = totalPositions(positions, dims),
                    rows = take(orderBy(groups, sortBy, sortDir), limit ?? MAX_ROWS),
                    artifact: ChatArtifact = {
                        id: nextId('positions'),
                        columns: [
                            ...dims.map((name: string): ChatDataColumn => ({name, type: 'string'})),
                            {name: 'pnl', type: 'number', label: 'P&L', format: 'currency'},
                            {
                                name: 'mktVal',
                                type: 'number',
                                label: 'Mkt Value',
                                format: 'currency'
                            },
                            {name: 'positions', type: 'integer'}
                        ],
                        rows,
                        totalRows: rows.length
                    };

                return toResult(artifact, {
                    groups: groups.length,
                    positions: positions.length,
                    pnl: sumBy(positions, 'pnl'),
                    mktVal: sumBy(positions, 'mktVal')
                });
            }
        },
        {
            name: 'query_trades',
            displayName: 'Query trades',
            description:
                'List trades of the sample portfolio, newest first by default, with optional ' +
                'filters. Returns the id of an artifact that holds a row per trade.',
            icon: Icon.transaction(),
            parameters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    filter: dimFilterSchema({
                        dir: {type: 'string', enum: ['Buy', 'Sell']}
                    }),
                    sortBy: {
                        type: 'string',
                        enum: ['time', 'quantity', 'price', 'commission', 'confidence']
                    },
                    sortDir: {type: 'string', enum: ['desc', 'asc']},
                    limit: {
                        type: 'integer',
                        minimum: 1,
                        maximum: MAX_ROWS,
                        description: `Most trades to return, after sorting. Default ${MAX_ROWS}.`
                    }
                }
            },
            summary: ({input}) => describeFilter(input?.filter),
            execute: async ({filter, sortBy = 'time', sortDir = 'desc', limit}) => {
                const trades = applyDimFilter(await data.getTradesAsync(), filter),
                    rows = take(orderBy(trades, sortBy, sortDir), limit ?? MAX_ROWS).map(it =>
                        pick(it, TRADE_FIELDS)
                    ),
                    artifact: ChatArtifact = {
                        id: nextId('trades'),
                        columns: TRADE_COLUMNS,
                        rows,
                        totalRows: rows.length
                    },
                    {Buy: buys = 0, Sell: sells = 0} = countBy(trades, 'dir');

                return toResult(
                    artifact,
                    {
                        trades: trades.length,
                        buys,
                        sells,
                        grossNotional: round(
                            sumBy(trades, it => Math.abs(it.quantity * it.price)),
                            0
                        )
                    },
                    // Times as the model reads them, not as the artifact holds them.
                    take(rows, PREVIEW_ROWS).map(it => ({
                        ...it,
                        time: new Date(it.time).toISOString()
                    }))
                );
            }
        },
        {
            name: 'get_price_history',
            displayName: 'Get price history',
            description:
                'Get the daily prices of one symbol of the sample portfolio: open, high, low, ' +
                'close and volume. Returns the id of an artifact that holds a row per day, ' +
                'oldest first. Find symbols with query_positions, grouped by symbol.',
            icon: Icon.chartLine(),
            parameters: {
                type: 'object',
                required: ['symbol'],
                additionalProperties: false,
                properties: {
                    symbol: {type: 'string', maxLength: 12, description: 'Ticker symbol.'},
                    days: {
                        type: 'integer',
                        minimum: 2,
                        maximum: MAX_ROWS,
                        description: 'Keep the most recent N trading days. Default all.'
                    }
                }
            },
            summary: ({input}) => input?.symbol ?? null,
            execute: async ({symbol, days}) => {
                const prices = takeRight(await data.getPricesAsync(symbol), days ?? MAX_ROWS),
                    firstClose = first(prices).close,
                    lastClose = last(prices).close,
                    artifact: ChatArtifact = {
                        id: nextId('prices'),
                        columns: PRICE_COLUMNS,
                        // A date column holds epoch millis.
                        rows: prices.map(it => ({...it, day: LocalDate.get(it.day).timestamp})),
                        totalRows: prices.length
                    };

                return toResult(
                    artifact,
                    {
                        symbol,
                        from: first(prices).day,
                        to: last(prices).day,
                        firstClose: round(firstClose, 2),
                        lastClose: round(lastClose, 2),
                        change: round(lastClose / firstClose - 1, 4),
                        high: maxBy(prices, 'high').high,
                        low: minBy(prices, 'low').low,
                        avgVolume: round(meanBy(prices, 'volume'), 0)
                    },
                    // Dates as the model reads them, not as the artifact holds them.
                    take(prices, PREVIEW_ROWS)
                );
            }
        }
    ];
}

/** Total raw positions by the given dimensions: a row per group, with its P&L and market value. */
export function totalPositions(
    positions: PricedRawPosition[],
    dims: PortfolioDim[]
): PlainObject[] {
    const groups = groupBy(positions, it => dims.map(dim => it[dim]).join('|'));
    return Object.values(groups).map(members => ({
        ...pick(members[0], dims),
        pnl: sumBy(members, 'pnl'),
        mktVal: sumBy(members, 'mktVal'),
        positions: members.length
    }));
}

//------------------
// Implementation
//------------------
const MAX_ROWS = 500,
    PREVIEW_ROWS = 5;

const TRADE_COLUMNS: ChatDataColumn[] = [
        {name: 'time', type: 'datetime'},
        {name: 'symbol', type: 'string'},
        {name: 'dir', type: 'string', label: 'Side'},
        {name: 'quantity', type: 'integer'},
        {name: 'price', type: 'number', format: 'currency', decimals: 2},
        {name: 'commission', type: 'number', format: 'currency', decimals: 0},
        {name: 'confidence', type: 'integer'},
        {name: 'sector', type: 'string'},
        {name: 'region', type: 'string'},
        {name: 'fund', type: 'string'},
        {name: 'model', type: 'string'},
        {name: 'trader', type: 'string'}
    ],
    TRADE_FIELDS = TRADE_COLUMNS.map(it => it.name);

const PRICE_COLUMNS: ChatDataColumn[] = [
    {name: 'day', type: 'date'},
    {name: 'open', type: 'number', format: 'currency', decimals: 2},
    {name: 'high', type: 'number', format: 'currency', decimals: 2},
    {name: 'low', type: 'number', format: 'currency', decimals: 2},
    {name: 'close', type: 'number', format: 'currency', decimals: 2},
    {name: 'volume', type: 'integer'}
];

/** Loads each data set of the sample portfolio once, on first use. */
class PortfolioData {
    private positions: Promise<PricedRawPosition[]>;
    private trades: Promise<PlainObject[]>;
    private prices: Record<string, Promise<PlainObject[]>> = {};

    getPositionsAsync(): Promise<PricedRawPosition[]> {
        return (this.positions ??= XH.portfolioService.getPricedRawPositionsAsync({}));
    }

    getTradesAsync(): Promise<PlainObject[]> {
        return (this.trades ??= XH.portfolioService.getAllOrdersAsync({}));
    }

    async getPricesAsync(symbol: string): Promise<PlainObject[]> {
        const ret = await (this.prices[symbol] ??= XH.fetchJson({
            url: `portfolio/prices/${encodeURIComponent(symbol)}`
        }));
        // Thrown to the model, which can then look the symbol up.
        if (isEmpty(ret)) {
            throw new Error(
                `No prices for symbol '${symbol}'. Call query_positions, grouped by symbol, to ` +
                    'find the symbols of the portfolio.'
            );
        }
        return ret;
    }
}

/** A filter on the dimensions of positions and trades: an exact value for each one given. */
function dimFilterSchema(extraProperties: PlainObject = {}): PlainObject {
    const {lookups} = XH.portfolioService,
        withValues = (values: string[]) => (isEmpty(values) ? {} : {enum: values});
    return {
        type: 'object',
        additionalProperties: false,
        description: 'Keep only the rows that match every value given.',
        properties: {
            symbol: {type: 'string', maxLength: 12},
            sector: {type: 'string', ...withValues(lookups?.sectors)},
            region: {type: 'string', ...withValues(lookups?.regions)},
            fund: {type: 'string', ...withValues(lookups?.funds)},
            model: {type: 'string', ...withValues(lookups?.models)},
            trader: {type: 'string', ...withValues(lookups?.traders)},
            ...extraProperties
        }
    };
}

function applyDimFilter<T extends PlainObject>(rows: T[], filter: PlainObject): T[] {
    const conditions = Object.entries(pickBy(filter, it => it != null));
    return isEmpty(conditions)
        ? rows
        : rows.filter(row => conditions.every(([field, value]) => row[field] === value));
}

function describeFilter(filter: PlainObject): string {
    const values = Object.values(pickBy(filter, it => it != null));
    return isEmpty(values) ? 'all trades' : values.join(', ');
}

/**
 * The result of a tool: the artifact for the chat, and for the model its id, its columns, a
 * summary of the whole result and its first rows.
 */
function toResult(
    artifact: ChatArtifact,
    summary: PlainObject,
    preview: PlainObject[] = take(artifact.rows, PREVIEW_ROWS)
) {
    const {id, columns, totalRows} = artifact;
    return chatToolResult(
        {
            artifact: id,
            columns: columns.map(({name, type}) => `${name}: ${type}`),
            totalRows,
            summary,
            firstRows: preview
        },
        {artifacts: [artifact]}
    );
}
