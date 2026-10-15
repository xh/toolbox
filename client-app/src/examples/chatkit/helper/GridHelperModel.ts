import type {ChatDocLink} from '@xh/hoist-chat-kit/assist';
import {ChatAssistantModel, gridTools} from '@xh/hoist-chat-kit/assist';
import {ScriptedChatTransport} from '@xh/hoist-chat-kit/transport';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed} from '@xh/hoist/core';
import {numberRenderer} from '@xh/hoist/format';
import {createGridHelperResponse, GRID_HELPER_SUGGESTIONS} from './gridHelperScript';

/**
 * Model for the Grid Helper tab: a grid of invented positions, and a component helper beside it.
 * The helper acts on the grid only through the kit's `gridTools`, and its replies come from a
 * script in the browser, so it needs no server, model or API key.
 */
export class GridHelperModel extends HoistModel {
    @managed readonly gridModel: GridModel = new GridModel({
        store: {idSpec: 'symbol'},
        filterModel: true,
        colChooserModel: true,
        enableExport: true,
        exportOptions: {filename: 'macro-book-positions'},
        sortBy: 'symbol',
        columns: [
            {
                field: {name: 'symbol', type: 'string'},
                headerName: 'Ticker',
                width: 90,
                pinned: 'left'
            },
            {field: {name: 'name', type: 'string'}, flex: 1, minWidth: 180},
            {field: {name: 'sector', type: 'string'}, width: 120, filterable: true},
            {
                field: {name: 'quantity', type: 'int'},
                headerName: 'Qty',
                width: 100,
                renderer: numberRenderer({precision: 0})
            },
            {
                field: {name: 'price', type: 'number'},
                width: 100,
                renderer: numberRenderer({precision: 2})
            },
            {
                field: {name: 'marketValue', type: 'number'},
                headerName: 'Mkt Value',
                width: 130,
                filterable: true,
                renderer: numberRenderer({precision: 0})
            },
            {
                field: {name: 'dayPnl', type: 'number'},
                headerName: 'P&L Day',
                width: 120,
                absSort: true,
                filterable: true,
                renderer: numberRenderer({precision: 0, ledger: true, colorSpec: true})
            }
        ]
    });

    @managed readonly assistantModel = new ChatAssistantModel({
        groups: gridTools(this.gridModel, {
            title: 'Positions grid',
            description: 'Open positions in the Macro book, one row per security',
            boundary: {
                text: 'Sees column names and filters, not row data',
                shared: [
                    'Column names, types and widths',
                    'Sorting and grouping',
                    'Filters',
                    'Row counts'
                ],
                notShared: ['Tickers, quantities, prices and P&L']
            },
            docs: GRID_DOCS
        }),
        suggestions: GRID_HELPER_SUGGESTIONS,
        transport: new ScriptedChatTransport({delayMs: 15, respond: createGridHelperResponse})
    });

    constructor() {
        super();
        this.gridModel.loadData(createPositions());
    }
}

//------------------
// Implementation
//------------------
/**
 * Pages the helper may cite. Toolbox's own grid demos stand in for an app's documentation.
 */
const GRID_DOCS: ChatDocLink[] = [
    {
        title: 'Grids > Column filtering',
        url: '/app/grids/columnFiltering',
        description: 'Filtering rows from the column header menus'
    },
    {
        title: 'Grids > Grouped rows',
        url: '/app/grids/groupedRows',
        description: 'Grouping rows under collapsible header rows'
    },
    {
        title: 'Grids > Column chooser',
        url: '/app/grids/columnChooser',
        description: 'Showing, hiding and ordering columns'
    }
];

// Ticker, name, sector, quantity, price and P&L on the day - invented, for the Macro book.
const POSITIONS: Array<[string, string, string, number, number, number]> = [
    ['NVDA', 'NVIDIA Corp', 'Technology', 42000, 118.4, -612300],
    ['MSFT', 'Microsoft Corp', 'Technology', 9500, 431.2, 38900],
    ['AMD', 'Advanced Micro Devices', 'Technology', 18000, 152.1, -319000],
    ['ORCL', 'Oracle Corp', 'Technology', 11200, 171.6, 14600],
    ['CRM', 'Salesforce Inc', 'Technology', 6800, 268.9, -21400],
    ['JPM', 'JPMorgan Chase', 'Financials', 14000, 212.3, 22100],
    ['ZION', 'Zions Bancorp', 'Financials', 31000, 48.7, -287400],
    ['SCHW', 'Charles Schwab', 'Financials', 12500, 72.4, 6300],
    ['KEY', 'KeyCorp', 'Financials', 40000, 16.9, -18200],
    ['XOM', 'Exxon Mobil', 'Energy', 16000, 111.8, 31200],
    ['CVX', 'Chevron Corp', 'Energy', 9000, 149.3, 12400],
    ['OXY', 'Occidental Petroleum', 'Energy', 20000, 53.6, -9800],
    ['UNH', 'UnitedHealth Group', 'Health Care', 3200, 512.4, -44100],
    ['JNJ', 'Johnson & Johnson', 'Health Care', 8800, 158.2, 9700],
    ['LLY', 'Eli Lilly', 'Health Care', 1900, 802.1, 51800],
    ['NEE', 'NextEra Energy', 'Utilities', 15000, 74.3, -6200],
    ['DUK', 'Duke Energy', 'Utilities', 9000, 108.6, 4100]
];

function createPositions() {
    return POSITIONS.map(([symbol, name, sector, quantity, price, dayPnl]) => ({
        symbol,
        name,
        sector,
        quantity,
        price,
        marketValue: Math.round(quantity * price),
        dayPnl
    }));
}
