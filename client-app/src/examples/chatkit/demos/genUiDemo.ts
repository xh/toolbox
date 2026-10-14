import type {
    ChatUiCardSpecProps,
    ChatUiChartSpecProps,
    ChatUiGridSpecProps,
    ChatUiMetricsSpecProps
} from '@xh/hoist-chat-kit/desktop/cmp/genui';
import {
    ScriptedChatTransport,
    scriptedDelay,
    textEvents,
    toolCallEvents
} from '@xh/hoist-chat-kit/transport';
import type {ChatRunRequest, ScriptedRequestContext} from '@xh/hoist-chat-kit/transport';
import {Icon} from '@xh/hoist/icon';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {groupBy, round, sortBy, sumBy} from 'lodash';
import {createCatalog} from './catalog';
import type {ChatKitDemo} from './Types';

/**
 * Generative UI: the model shows Hoist components inline in its reply - a metrics row, a grid of
 * positions that fills in row by row, a line chart and a card with follow-up actions - through
 * a ChatUiCatalog of the kit's built-in components.
 */
export const genUiDemo: ChatKitDemo = {
    id: 'genUi',
    title: 'Generative UI',
    description: 'Metrics, a streaming grid, a chart and a card',
    icon: Icon.mixedChart(),
    heading: 'Ask for a portfolio review',
    intro:
        'The model answers with live Hoist components: KPI tiles, a grid of 30 positions that ' +
        'fills in as it streams, a performance chart and a card whose buttons ask follow-ups.',
    suggestions: [{text: 'How is the Tech book doing?'}, {text: 'Give me a portfolio review'}],
    createChatConfig: () => ({
        transport: new ScriptedChatTransport({delayMs: 14, respond: createResponse}),
        tools: createCatalog().tools
    })
};

//------------------
// Implementation
//------------------
// The card's follow-up prompts ask about NVDA or sectors, and get the drill-down. Any other
// message gets the review.
function createResponse(request: ChatRunRequest, {stepIndex, userMessage}: ScriptedRequestContext) {
    const isReview = !/nvda|sector/i.test(userMessage?.text);
    if (stepIndex > 0) {
        return [
            scriptedDelay(300),
            textEvents(
                isReview
                    ? 'Use the buttons on the card to dig into NVDA, or ask about any position.'
                    : 'Want me to break any of these down further?'
            )
        ];
    }
    return isReview ? createReview() : createDrillDown();
}

function createReview() {
    return [
        scriptedDelay(500),
        textEvents("Here's where the **Tech book** stands at the close:"),
        toolCallEvents('show_metrics', createMetrics()),
        textEvents(
            'The book is down on the day, almost all of it in semiconductors. Here are the ' +
                '30 positions, largest first:'
        ),
        toolCallEvents('show_grid', createPositionsGrid(), {chunkSize: 14}),
        textEvents(
            'Over the last three months the book has stayed ahead of its benchmark, though the ' +
                'lead narrowed sharply this week:'
        ),
        toolCallEvents('show_chart', createPerformanceChart(), {chunkSize: 24}),
        textEvents("NVDA is today's biggest detractor:"),
        toolCallEvents('show_card', createNvdaCard())
    ];
}

function createDrillDown() {
    return [
        scriptedDelay(500),
        textEvents('Here are the last eight NVDA trades, and how the book is spread by sector:'),
        toolCallEvents('show_grid', TRADES_GRID),
        toolCallEvents('show_chart', createSectorChart()),
        textEvents(
            'The position was built mostly in September, at an average of $104. Semiconductors ' +
                'are now a third of the book, above the 25% guideline.'
        )
    ];
}

function createMetrics(): ChatUiMetricsSpecProps {
    const rows = getPositionRows(),
        nav = sumBy(rows, 'marketValue'),
        dayPnl = sumBy(rows, 'dayPnl');
    return {
        metrics: [
            {
                label: 'Net asset value',
                value: nav,
                format: 'currency',
                decimals: 0,
                delta: dayPnl / (nav - dayPnl),
                deltaFormat: 'percent',
                deltaLabel: 'today'
            },
            {label: 'Day P&L', value: dayPnl, format: 'currency', decimals: 0, intent: 'danger'},
            {
                label: 'YTD return',
                value: 0.146,
                format: 'percent',
                delta: 0.021,
                deltaFormat: 'percent',
                deltaLabel: 'vs benchmark',
                intent: 'success'
            },
            {
                label: 'VaR (95%, 1-day)',
                value: 724000,
                format: 'currency',
                decimals: 0,
                delta: 0.06,
                deltaFormat: 'percent',
                deltaLabel: 'vs last week',
                intent: 'warning'
            }
        ]
    };
}

// Symbol, name, sector, quantity, price and move on the day, for the 30 positions.
const POSITIONS: Array<[string, string, string, number, number, number]> = [
    ['NVDA', 'NVIDIA Corp', 'Semiconductors', 24000, 118.42, -0.061],
    ['MSFT', 'Microsoft Corp', 'Software', 8500, 412.1, -0.012],
    ['AAPL', 'Apple Inc', 'Hardware', 15000, 231.6, 0.007],
    ['AVGO', 'Broadcom Inc', 'Semiconductors', 9000, 172.3, -0.044],
    ['AMZN', 'Amazon.com Inc', 'Internet', 9800, 186.4, 0.004],
    ['META', 'Meta Platforms', 'Internet', 2600, 576.2, -0.006],
    ['GOOGL', 'Alphabet Inc', 'Internet', 7600, 163.8, 0.011],
    ['AMD', 'Advanced Micro Devices', 'Semiconductors', 8200, 152.9, -0.052],
    ['ORCL', 'Oracle Corp', 'Software', 6400, 171.2, 0.009],
    ['CRM', 'Salesforce Inc', 'Software', 3800, 284.5, -0.003],
    ['ADBE', 'Adobe Inc', 'Software', 1700, 512.4, 0.013],
    ['TSM', 'Taiwan Semiconductor', 'Semiconductors', 5200, 188.1, -0.039],
    ['QCOM', 'Qualcomm Inc', 'Semiconductors', 4600, 168.7, -0.027],
    ['INTU', 'Intuit Inc', 'Software', 1200, 641.3, 0.005],
    ['NOW', 'ServiceNow Inc', 'Software', 900, 893.2, -0.008],
    ['TXN', 'Texas Instruments', 'Semiconductors', 3600, 201.4, -0.021],
    ['MU', 'Micron Technology', 'Semiconductors', 6100, 104.6, -0.058],
    ['IBM', 'IBM Corp', 'Hardware', 3100, 221.9, 0.002],
    ['CSCO', 'Cisco Systems', 'Hardware', 11500, 53.1, 0.006],
    ['PANW', 'Palo Alto Networks', 'Software', 1500, 362.7, -0.011],
    ['SNPS', 'Synopsys Inc', 'Software', 900, 524.8, -0.019],
    ['ANET', 'Arista Networks', 'Hardware', 1500, 381.5, -0.024],
    ['LRCX', 'Lam Research', 'Semiconductors', 600, 812.3, -0.047],
    ['AMAT', 'Applied Materials', 'Semiconductors', 2400, 198.6, -0.041],
    ['KLAC', 'KLA Corp', 'Semiconductors', 650, 752.9, -0.036],
    ['SHOP', 'Shopify Inc', 'Internet', 4200, 79.4, 0.018],
    ['UBER', 'Uber Technologies', 'Internet', 4800, 74.2, 0.009],
    ['NFLX', 'Netflix Inc', 'Internet', 450, 702.6, 0.014],
    ['DELL', 'Dell Technologies', 'Hardware', 2700, 118.9, -0.016],
    ['HPQ', 'HP Inc', 'Hardware', 7400, 35.8, 0.003]
];

function getPositionRows() {
    return POSITIONS.map(([symbol, name, sector, quantity, price, change]) => {
        const marketValue = quantity * price;
        return {
            symbol,
            name,
            sector,
            quantity,
            price,
            marketValue: round(marketValue),
            dayPnl: round((marketValue * change) / (1 + change)),
            change
        };
    });
}

function createPositionsGrid(): ChatUiGridSpecProps {
    return {
        title: 'Tech book - positions',
        columns: [
            {field: 'symbol', headerName: 'Symbol'},
            {field: 'name', headerName: 'Name'},
            {field: 'sector', headerName: 'Sector'},
            {field: 'quantity', headerName: 'Qty', type: 'number', decimals: 0},
            {field: 'price', headerName: 'Price', type: 'number', format: 'currency'},
            {
                field: 'marketValue',
                headerName: 'Mkt value',
                type: 'number',
                format: 'currency',
                decimals: 0
            },
            {
                field: 'dayPnl',
                headerName: 'Day P&L',
                type: 'number',
                format: 'currency',
                decimals: 0
            },
            {field: 'change', headerName: 'Chg', type: 'number', format: 'percent'}
        ],
        sortBy: 'marketValue|desc',
        rows: getPositionRows()
    };
}

function createPerformanceChart(): ChatUiChartSpecProps {
    // Sixty trading days of the book and its benchmark, indexed to 100.
    const start = LocalDate.get('2026-07-20'),
        book: Array<[string, number]> = [],
        benchmark: Array<[string, number]> = [];
    let date = start,
        bookLevel = 100,
        benchLevel = 100;
    for (let idx = 0; idx < 60; idx++) {
        book.push([date.isoString, round(bookLevel, 2)]);
        benchmark.push([date.isoString, round(benchLevel, 2)]);
        bookLevel *= 1 + 0.0012 + 0.011 * Math.sin(idx / 4.3) * Math.cos(idx / 9);
        benchLevel *= 1 + 0.0006 + 0.008 * Math.sin(idx / 5.1 + 1);
        if (idx > 54) bookLevel *= 0.985;
        date = date.nextWeekday();
    }
    return {
        title: 'Tech book vs benchmark (indexed to 100)',
        type: 'line',
        xAxis: {type: 'datetime'},
        yAxis: {format: 'number', decimals: 1},
        series: [
            {name: 'Tech book', data: book},
            {name: 'Benchmark', data: benchmark}
        ]
    };
}

function createNvdaCard(): ChatUiCardSpecProps {
    const rows = getPositionRows(),
        nvda = rows.find(it => it.symbol === 'NVDA');
    return {
        title: 'NVIDIA Corp (NVDA)',
        subtitle: 'Semiconductors - largest detractor today',
        fields: [
            {label: 'Position', value: nvda.quantity, decimals: 0},
            {label: 'Last price', value: nvda.price, format: 'currency'},
            {label: 'Day move', value: nvda.change, format: 'percent'},
            {label: 'Day P&L', value: nvda.dayPnl, format: 'currency', decimals: 0},
            {
                label: 'Weight in book',
                value: nvda.marketValue / sumBy(rows, 'marketValue'),
                format: 'percent'
            },
            {label: 'Average cost', value: 104.18, format: 'currency'},
            {label: 'Analyst rating', value: 'Buy (38 of 45)'},
            {label: 'Next earnings', value: 'Nov 19, 2026'}
        ],
        actions: [
            {text: 'Show NVDA trades', prompt: 'Show my recent NVDA trades.'},
            {text: 'Sector exposure', prompt: 'How is the book spread across sectors?'},
            {text: 'Explain the move', prompt: 'Why did NVDA fall 6% today?'}
        ]
    };
}

const TRADES_GRID: ChatUiGridSpecProps = {
    title: 'NVDA - recent trades',
    columns: [
        {field: 'tradeDate', headerName: 'Date', type: 'date'},
        {field: 'side', headerName: 'Side'},
        {field: 'quantity', headerName: 'Qty', type: 'number', decimals: 0},
        {field: 'price', headerName: 'Price', type: 'number', format: 'currency'},
        {field: 'trader', headerName: 'Trader'},
        {field: 'settled', headerName: 'Settled', type: 'boolean'}
    ],
    sortBy: 'tradeDate|desc',
    rows: [
        {
            tradeDate: '2026-10-12',
            side: 'SELL',
            quantity: 1000,
            price: 126.1,
            trader: 'JL',
            settled: false
        },
        {
            tradeDate: '2026-10-07',
            side: 'BUY',
            quantity: 1500,
            price: 121.85,
            trader: 'AM',
            settled: true
        },
        {
            tradeDate: '2026-09-30',
            side: 'BUY',
            quantity: 2000,
            price: 112.4,
            trader: 'AM',
            settled: true
        },
        {
            tradeDate: '2026-09-24',
            side: 'BUY',
            quantity: 2500,
            price: 104.9,
            trader: 'JL',
            settled: true
        },
        {
            tradeDate: '2026-09-18',
            side: 'BUY',
            quantity: 3000,
            price: 98.75,
            trader: 'AM',
            settled: true
        },
        {
            tradeDate: '2026-09-11',
            side: 'SELL',
            quantity: 500,
            price: 101.2,
            trader: 'KS',
            settled: true
        },
        {
            tradeDate: '2026-09-04',
            side: 'BUY',
            quantity: 1500,
            price: 96.3,
            trader: 'KS',
            settled: true
        },
        {
            tradeDate: '2026-08-28',
            side: 'BUY',
            quantity: 1000,
            price: 99.6,
            trader: 'JL',
            settled: true
        }
    ]
};

function createSectorChart(): ChatUiChartSpecProps {
    const rows = getPositionRows(),
        nav = sumBy(rows, 'marketValue'),
        bySector = groupBy(rows, 'sector'),
        sectors = sortBy(Object.keys(bySector), it => -sumBy(bySector[it], 'marketValue'));
    return {
        title: 'Tech book by sector',
        type: 'pie',
        xAxis: {categories: sectors},
        yAxis: {format: 'percent'},
        series: [
            {
                name: 'Weight',
                data: sectors.map(it => round(sumBy(bySector[it], 'marketValue') / nav, 4))
            }
        ]
    };
}
