import {ColumnOrGroupSpec, ColumnSpec} from '@xh/hoist/cmp/grid';
import {PlainObject} from '@xh/hoist/core';
import {dateRenderer, numberRenderer} from '@xh/hoist/format';
import {cloneDeep} from 'lodash';

export type GridSize = 'small' | 'medium' | 'large';

/** Custom column added interactively via the Add Column form. */
export interface CustomColumn {
    spec: ColumnSpec;
    /** Target group id, or '' for top-level. New ids create a new top-level group. */
    group: string;
}

/**
 * Generate a realistic hedge-fund blotter column set + matching records, sized small / medium /
 * large to exercise the ColumnChooser at increasing scale (large ≈ 145 leaves).
 *
 * Columns are defined once as a tagged catalog (see CATALOG) and filtered per size by each leaf's
 * `tier` (the smallest size at which it appears); empty groups are pruned. The bulk of the leaves
 * come from cross-products - P&L is metric-type × period, rates/credit risk is measure × tenor -
 * which is both true-to-life and what lets the set scale while staying balanced across groups.
 *
 * Visual column groups follow the natural blotter layout (Security, Pricing, P&L by type, Risk by
 * measure-family, ...). `chooserGroup`s deliberately slice along a *different* axis - identifiers
 * vs. classification, P&L by period rather than by type - so the chooser's available-columns grid
 * groups differently than the headers, which is the more interesting case to test.
 *
 * The long tail of columns starts hidden (see `lf`), leaving a focused ~2 dozen-column default view
 * that the chooser reveals - realistic for a blotter and ensuring the chooser always has content.
 */
export function generateGridData(size: GridSize): {
    columns: ColumnOrGroupSpec[];
    records: PlainObject[];
} {
    const nodes = pruneToSize(CATALOG, size),
        leaves = collectLeaves(nodes);
    return {columns: nodes.map(toColumnSpec), records: generateRecords(leaves)};
}

/** Merge interactively-added columns into a generated column tree (returns a fresh tree). */
export function mergeCustomColumns(
    columns: ColumnOrGroupSpec[],
    customs: CustomColumn[]
): ColumnOrGroupSpec[] {
    const result = cloneDeep(columns);
    customs.forEach(({spec, group}) => {
        if (!group) {
            result.push(spec);
        } else if (!appendToGroup(result, group, spec)) {
            result.push({
                groupId: group,
                headerName: group,
                headerAlign: 'center',
                children: [spec]
            });
        }
    });
    return result;
}

/** Group option for the Add Column group selector: `value` is the groupId, `label` its header. */
export interface GroupOption {
    value: string;
    label: string;
}

/** Collect all groups (id + header label) in a column tree, for the Add Column group selector. */
export function collectGroups(columns: ColumnOrGroupSpec[]): GroupOption[] {
    const out: GroupOption[] = [];
    const visit = (nodes: ColumnOrGroupSpec[]) =>
        nodes.forEach(node => {
            if (isGroup(node)) {
                out.push({value: node.groupId, label: node.headerName ?? node.groupId});
                visit(node.children);
            }
        });
    visit(columns);
    return out;
}

/** Collect all distinct leaf `chooserGroup` values, for the Add Column chooser-group selector. */
export function collectChooserGroups(columns: ColumnOrGroupSpec[]): string[] {
    const groups = new Set<string>();
    const visit = (nodes: ColumnOrGroupSpec[]) =>
        nodes.forEach(node => {
            if (isGroup(node)) {
                visit(node.children);
            } else {
                const {chooserGroup} = node as ColumnSpec;
                if (chooserGroup) groups.add(chooserGroup);
            }
        });
    visit(columns);
    return Array.from(groups);
}

//------------------------
// Catalog model
//------------------------
type Tier = 'small' | 'medium' | 'large';
const TIER_RANK: Record<Tier, number> = {small: 0, medium: 1, large: 2};

/** Value/format family for a leaf - drives field type, renderer, alignment and width. */
type Kind = 'text' | 'int' | 'price' | 'amount' | 'pct' | 'ratio' | 'date';

interface LeafDef {
    id: string;
    name: string;
    kind: Kind;
    chooserGroup: string;
    /** Smallest size at which this leaf appears. */
    tier: Tier;
    /** Hidden in the grid by default (still listed in the chooser). */
    hidden: boolean;
}

interface GroupDef {
    id: string;
    name: string;
    children: Node[];
}

type Node = LeafDef | GroupDef;

// `hidden` defaults to true for `large`-tier leaves (the long tail starts hidden); pass explicitly
// to override - e.g. hide a secondary `medium` column so the default size also has hidden columns.
const lf = (
    id: string,
    name: string,
    kind: Kind,
    chooserGroup: string,
    tier: Tier = 'large',
    hidden?: boolean
) => ({id, name, kind, chooserGroup, tier, hidden: hidden ?? tier === 'large'}) as LeafDef;

const grp = (id: string, name: string, children: Node[]) => ({id, name, children}) as GroupDef;

const maxTier = (a: Tier, b: Tier): Tier => (TIER_RANK[a] >= TIER_RANK[b] ? a : b);

//------------------------
// Catalog - the full (large) blotter schema. Smaller sizes are filtered subsets.
//------------------------
const PNL_PERIODS: {sfx: string; name: string; tier: Tier}[] = [
    {sfx: 'Daily', name: 'Daily', tier: 'small'},
    {sfx: 'Wtd', name: 'WTD', tier: 'large'},
    {sfx: 'Mtd', name: 'MTD', tier: 'medium'},
    {sfx: 'Qtd', name: 'QTD', tier: 'large'},
    {sfx: 'Ytd', name: 'YTD', tier: 'medium'},
    {sfx: 'Itd', name: 'ITD', tier: 'medium'}
];

const PNL_TYPES: {key: string; name: string; tier: Tier}[] = [
    {key: 'Total', name: 'Total', tier: 'small'},
    {key: 'Real', name: 'Realized', tier: 'large'},
    {key: 'Unreal', name: 'Unrealized', tier: 'large'},
    {key: 'Fx', name: 'FX', tier: 'large'}
];

const RATE_TENORS = ['3M', '6M', '1Y', '2Y', '5Y', '10Y', '30Y'];
const CREDIT_TENORS = ['1Y', '3Y', '5Y', '7Y', '10Y'];

// P&L: column-grouped by metric type, but chooser-grouped by period (the cross-cutting axis).
const pnlGroup = grp(
    'grp-pnl',
    'P&L',
    PNL_TYPES.map(t =>
        grp(
            `grp-pnl-${t.key.toLowerCase()}`,
            `${t.name} P&L`,
            PNL_PERIODS.map(p =>
                lf(
                    `pnl${t.key}${p.sfx}`,
                    p.name,
                    'amount',
                    `${p.name} P&L`,
                    maxTier(t.tier, p.tier)
                )
            )
        )
    )
);

const riskGroup = grp('grp-risk', 'Risk', [
    grp('grp-greeks', 'Greeks', [
        lf('delta', 'Delta', 'ratio', 'Greeks', 'small'),
        lf('gamma', 'Gamma', 'ratio', 'Greeks', 'medium'),
        lf('vega', 'Vega', 'ratio', 'Greeks', 'medium', true),
        lf('theta', 'Theta', 'ratio', 'Greeks', 'medium', true),
        lf('rho', 'Rho', 'ratio', 'Greeks'),
        lf('vanna', 'Vanna', 'ratio', 'Greeks'),
        lf('volga', 'Volga', 'ratio', 'Greeks'),
        lf('charm', 'Charm', 'ratio', 'Greeks'),
        lf('speed', 'Speed', 'ratio', 'Greeks'),
        lf('color', 'Color', 'ratio', 'Greeks'),
        lf('zomma', 'Zomma', 'ratio', 'Greeks'),
        lf('deltaCash', 'Delta Cash', 'amount', 'Greeks')
    ]),
    grp('grp-rates', 'Rates', [
        lf('dv01', 'DV01', 'amount', 'Rates Risk', 'medium'),
        lf('ir01', 'IR01', 'amount', 'Rates Risk'),
        lf('pv01', 'PV01', 'amount', 'Rates Risk'),
        lf('duration', 'Duration', 'ratio', 'Rates Risk', 'medium', true),
        lf('modDuration', 'Mod. Duration', 'ratio', 'Rates Risk'),
        lf('convexity', 'Convexity', 'ratio', 'Rates Risk'),
        ...RATE_TENORS.map(t => lf(`krd${t}`, `KRD ${t}`, 'amount', 'Rates Risk'))
    ]),
    grp('grp-credit', 'Credit', [
        lf('cs01', 'CS01', 'amount', 'Credit Risk', 'medium'),
        lf('jtd', 'JTD', 'amount', 'Credit Risk'),
        lf('cr01', 'CR01', 'amount', 'Credit Risk'),
        lf('spreadDuration', 'Spread Dur.', 'ratio', 'Credit Risk'),
        ...CREDIT_TENORS.map(t => lf(`cs01${t}`, `CS01 ${t}`, 'amount', 'Credit Risk'))
    ])
]);

const CATALOG: GroupDef[] = [
    grp('grp-security', 'Security', [
        lf('symbol', 'Symbol', 'text', 'Identifiers', 'small'),
        lf('description', 'Description', 'text', 'Identifiers'),
        lf('underlyer', 'Underlyer', 'text', 'Identifiers', 'medium', true),
        lf('underlyerType', 'Underlyer Type', 'text', 'Identifiers'),
        lf('cusip', 'CUSIP', 'text', 'Identifiers'),
        lf('isin', 'ISIN', 'text', 'Identifiers'),
        lf('sedol', 'SEDOL', 'text', 'Identifiers'),
        lf('ric', 'RIC', 'text', 'Identifiers'),
        lf('bbgTicker', 'BBG Ticker', 'text', 'Identifiers'),
        lf('assetClass', 'Asset Class', 'text', 'Classification', 'medium'),
        lf('productType', 'Product Type', 'text', 'Classification'),
        lf('sector', 'Sector', 'text', 'Classification', 'medium'),
        lf('industry', 'Industry', 'text', 'Classification'),
        lf('region', 'Region', 'text', 'Classification'),
        lf('country', 'Country', 'text', 'Classification'),
        lf('ccy', 'Currency', 'text', 'Classification', 'medium'),
        lf('rating', 'Rating', 'text', 'Classification'),
        lf('side', 'Side', 'text', 'Classification', 'small')
    ]),
    grp('grp-account', 'Account', [
        lf('fund', 'Fund', 'text', 'Ownership'),
        lf('portfolio', 'Portfolio', 'text', 'Ownership', 'small'),
        lf('subPortfolio', 'Sub-Portfolio', 'text', 'Ownership', 'medium', true),
        lf('strategy', 'Strategy', 'text', 'Ownership', 'medium'),
        lf('book', 'Book', 'text', 'Ownership'),
        lf('desk', 'Desk', 'text', 'Ownership'),
        lf('trader', 'Trader', 'text', 'Ownership', 'medium'),
        lf('pm', 'PM', 'text', 'Ownership'),
        lf('analyst', 'Analyst', 'text', 'Ownership'),
        lf('custodian', 'Custodian', 'text', 'Ownership'),
        lf('benchmark', 'Benchmark', 'text', 'Ownership')
    ]),
    grp('grp-trade', 'Trade', [
        lf('tradeDate', 'Trade Date', 'date', 'Dates', 'medium'),
        lf('settleDate', 'Settle Date', 'date', 'Dates'),
        lf('maturityDate', 'Maturity', 'date', 'Dates', 'medium'),
        lf('expiryDate', 'Expiry', 'date', 'Dates'),
        lf('lastUpdate', 'Last Update', 'date', 'Dates')
    ]),
    grp('grp-pricing', 'Pricing', [
        lf('quantity', 'Quantity', 'int', 'Quantity & Price', 'small'),
        lf('sodQty', 'SOD Qty', 'int', 'Quantity & Price'),
        lf('tradedQty', 'Traded Qty', 'int', 'Quantity & Price'),
        lf('openQty', 'Open Qty', 'int', 'Quantity & Price'),
        lf('price', 'Price', 'price', 'Quantity & Price', 'small'),
        lf('priceLocal', 'Price (Local)', 'price', 'Quantity & Price', 'medium', true),
        lf('sodPrice', 'SOD Price', 'price', 'Quantity & Price'),
        lf('prevPrice', 'Prev Price', 'price', 'Quantity & Price'),
        lf('bid', 'Bid', 'price', 'Quantity & Price'),
        lf('ask', 'Ask', 'price', 'Quantity & Price'),
        lf('mid', 'Mid', 'price', 'Quantity & Price'),
        lf('vwap', 'VWAP', 'price', 'Quantity & Price'),
        lf('multiplier', 'Multiplier', 'ratio', 'Quantity & Price'),
        lf('factor', 'Factor', 'ratio', 'Quantity & Price'),
        lf('fxRate', 'FX Rate', 'ratio', 'Quantity & Price', 'medium', true),
        lf('spreadBps', 'Spread (bps)', 'ratio', 'Quantity & Price')
    ]),
    grp('grp-valuation', 'Valuation', [
        lf('marketValue', 'Market Value', 'amount', 'Valuation', 'small'),
        lf('marketValueLocal', 'MV (Local)', 'amount', 'Valuation'),
        lf('notional', 'Notional', 'amount', 'Valuation', 'medium'),
        lf('notionalLocal', 'Notional (Local)', 'amount', 'Valuation'),
        lf('cost', 'Cost', 'amount', 'Valuation', 'medium', true),
        lf('costLocal', 'Cost (Local)', 'amount', 'Valuation'),
        lf('avgCost', 'Avg Cost', 'price', 'Valuation'),
        lf('accruedInterest', 'Accrued Int.', 'amount', 'Valuation'),
        lf('navPct', '% NAV', 'pct', 'Valuation')
    ]),
    grp('grp-exposure', 'Exposure', [
        lf('grossExposure', 'Gross Exp.', 'amount', 'Exposure', 'medium'),
        lf('netExposure', 'Net Exp.', 'amount', 'Exposure', 'medium'),
        lf('longExposure', 'Long Exp.', 'amount', 'Exposure'),
        lf('shortExposure', 'Short Exp.', 'amount', 'Exposure'),
        lf('exposurePct', 'Exp. %', 'pct', 'Exposure'),
        lf('portfolioWeight', 'Weight', 'pct', 'Exposure', 'medium', true),
        lf('deltaAdjExposure', 'Delta-Adj. Exp.', 'amount', 'Exposure'),
        lf('betaAdjExposure', 'Beta-Adj. Exp.', 'amount', 'Exposure')
    ]),
    pnlGroup,
    riskGroup,
    grp('grp-liquidity', 'Liquidity & Limits', [
        grp('grp-liq', 'Liquidity', [
            lf('adv', 'ADV', 'amount', 'Liquidity'),
            lf('pctAdv', '% ADV', 'pct', 'Liquidity'),
            lf('daysToLiquidate', 'Days to Liq.', 'ratio', 'Liquidity'),
            lf('borrowRate', 'Borrow Rate', 'pct', 'Liquidity'),
            lf('borrowAvail', 'Borrow Avail.', 'int', 'Liquidity'),
            lf('daysToCover', 'Days to Cover', 'ratio', 'Liquidity')
        ]),
        grp('grp-limits', 'Limits', [
            lf('var95', 'VaR 95%', 'amount', 'Risk Limits'),
            lf('var99', 'VaR 99%', 'amount', 'Risk Limits'),
            lf('varContribution', 'VaR Contrib.', 'amount', 'Risk Limits'),
            lf('stressPnl', 'Stress P&L', 'amount', 'Risk Limits'),
            lf('limitUtilization', 'Limit Util.', 'pct', 'Risk Limits'),
            lf('concentration', 'Concentration', 'pct', 'Risk Limits')
        ])
    ]),
    grp('grp-attribution', 'Attribution', [
        lf('priceReturn', 'Price Return', 'amount', 'P&L Attribution'),
        lf('fxReturn', 'FX Return', 'amount', 'P&L Attribution'),
        lf('carryReturn', 'Carry', 'amount', 'P&L Attribution'),
        lf('dividendPnl', 'Dividend P&L', 'amount', 'P&L Attribution'),
        lf('financingPnl', 'Financing P&L', 'amount', 'P&L Attribution'),
        lf('commissionPnl', 'Commission', 'amount', 'P&L Attribution'),
        lf('feePnl', 'Fees', 'amount', 'P&L Attribution')
    ])
];

//------------------------
// Tree transforms
//------------------------
function pruneToSize(nodes: Node[], size: GridSize): Node[] {
    const rank = TIER_RANK[size];
    const visit = (node: Node): Node | null => {
        if (isLeafDef(node)) return TIER_RANK[node.tier] <= rank ? node : null;
        const children = node.children.map(visit).filter(Boolean) as Node[];
        return children.length ? {...node, children} : null;
    };
    return nodes.map(visit).filter(Boolean) as Node[];
}

function collectLeaves(nodes: Node[]): LeafDef[] {
    const out: LeafDef[] = [];
    const visit = (node: Node) => (isLeafDef(node) ? out.push(node) : node.children.forEach(visit));
    nodes.forEach(visit);
    return out;
}

function toColumnSpec(node: Node): ColumnOrGroupSpec {
    if (isLeafDef(node)) {
        const {id, name, kind, chooserGroup} = node,
            fmt = KIND_FORMAT[kind],
            spec: ColumnSpec = {
                colId: id,
                field: {name: id, type: fmt.fieldType},
                displayName: name,
                chooserGroup,
                width: fmt.width
            };
        if (fmt.align) spec.align = fmt.align;
        if (fmt.renderer) spec.renderer = fmt.renderer;
        if (node.hidden) spec.hidden = true;
        return spec;
    }
    return {
        groupId: node.id,
        headerName: node.name,
        headerAlign: 'center',
        children: node.children.map(toColumnSpec)
    };
}

const isLeafDef = (node: Node): node is LeafDef => 'kind' in node;

//------------------------
// Per-kind formatting + value generation
//------------------------
interface KindFormat {
    fieldType: 'string' | 'int' | 'number' | 'date';
    width: number;
    align?: 'left' | 'right';
    renderer?: ColumnSpec['renderer'];
}

const KIND_FORMAT: Record<Kind, KindFormat> = {
    text: {fieldType: 'string', width: 140},
    int: {fieldType: 'int', width: 110, align: 'right', renderer: numberRenderer({precision: 0})},
    price: {
        fieldType: 'number',
        width: 100,
        align: 'right',
        renderer: numberRenderer({precision: 2})
    },
    amount: {
        fieldType: 'number',
        width: 130,
        align: 'right',
        renderer: numberRenderer({precision: 0, ledger: true, colorSpec: true})
    },
    pct: {
        fieldType: 'number',
        width: 90,
        align: 'right',
        renderer: numberRenderer({precision: 2, label: '%', colorSpec: true})
    },
    ratio: {
        fieldType: 'number',
        width: 100,
        align: 'right',
        renderer: numberRenderer({precision: 4})
    },
    date: {fieldType: 'date', width: 110, align: 'left', renderer: dateRenderer()}
};

const ROW_COUNT = 50;

const POOLS: Record<string, string[]> = {
    symbol: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'XOM', 'KO'],
    underlyer: ['AAPL', 'SPX', 'NDX', 'JPM', 'WTI', 'UST10Y', 'EUR', 'GOLD'],
    underlyerType: ['Equity', 'Index', 'Rate', 'Credit', 'FX', 'Commodity'],
    assetClass: ['Equity', 'Credit', 'Rates', 'FX', 'Commodity'],
    productType: ['Common', 'Bond', 'Option', 'Future', 'Swap', 'CDS'],
    sector: ['Tech', 'Financials', 'Energy', 'Health Care', 'Industrials', 'Utilities'],
    industry: ['Semis', 'Banks', 'Oil & Gas', 'Pharma', 'Airlines', 'Software'],
    region: ['North America', 'Europe', 'APAC', 'LatAm'],
    country: ['US', 'UK', 'DE', 'JP', 'FR', 'CN'],
    ccy: ['USD', 'EUR', 'GBP', 'JPY', 'CHF'],
    rating: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'NR'],
    side: ['Long', 'Short'],
    fund: ['Flagship', 'Opportunities', 'Quant'],
    portfolio: ['Global Macro', 'Equity L/S', 'Credit Opp.', 'Vol Arb'],
    subPortfolio: ['Core', 'Tactical', 'Hedge', 'Overlay'],
    strategy: ['Momentum', 'Mean Rev.', 'Carry', 'Relative Value'],
    book: ['Trading', 'Hedge', 'Financing'],
    desk: ['Equities', 'Credit', 'Rates', 'Macro'],
    trader: ['J. Smith', 'A. Lee', 'M. Chen', 'R. Patel'],
    pm: ['K. Jones', 'S. Gupta', 'D. Romano'],
    analyst: ['T. Ito', 'L. Müller', 'P. Okafor'],
    custodian: ['BNY', 'State St.', 'JPM', 'Citi'],
    benchmark: ['S&P 500', 'Russell 2000', 'Agg', 'HY Index']
};

function generateRecords(leaves: LeafDef[]): PlainObject[] {
    return Array.from({length: ROW_COUNT}, (_, r) => {
        const rec: PlainObject = {id: r};
        leaves.forEach((leaf, c) => (rec[leaf.id] = valueFor(leaf, r, c)));
        return rec;
    });
}

function valueFor(leaf: LeafDef, r: number, c: number): any {
    const seed = r * 37 + c * 101 + 13;
    switch (leaf.kind) {
        case 'text':
            return textValue(leaf.id, r);
        case 'int':
            return ((seed * 17) % 20000) - 10000;
        case 'price':
            return 10 + (seed % 49000) / 100;
        case 'amount':
            return ((seed * 991) % 4000000) - 2000000;
        case 'pct':
            return (seed % 4000) / 100 - 20;
        case 'ratio':
            return (seed % 200000) / 100000 - 1;
        case 'date':
            return new Date(2024, 0, 1 - (seed % 900));
    }
}

function textValue(id: string, r: number): string {
    const pool = POOLS[id];
    if (pool) return pool[(r + strHash(id)) % pool.length];
    return `${id.slice(0, 4).toUpperCase()}${100 + ((r * 7 + strHash(id)) % 900)}`;
}

function strHash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
    return h;
}

//------------------------
// Shared tree helpers (operate on produced ColumnOrGroupSpec trees)
//------------------------
function appendToGroup(nodes: ColumnOrGroupSpec[], groupId: string, spec: ColumnSpec): boolean {
    for (const node of nodes) {
        if (isGroup(node)) {
            if (node.groupId === groupId) {
                node.children.push(spec);
                return true;
            }
            if (appendToGroup(node.children, groupId, spec)) return true;
        }
    }
    return false;
}

function isGroup(node: ColumnOrGroupSpec): node is ColumnOrGroupSpec & {
    groupId: string;
    headerName?: string;
    children: ColumnOrGroupSpec[];
} {
    return 'children' in node;
}
