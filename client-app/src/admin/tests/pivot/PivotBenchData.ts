import {PlainObject} from '@xh/hoist/core';
import {throwIf} from '@xh/hoist/utils/js';

/**
 * Profiles and synthetic data for the PivotGrid benchmark.
 *
 * Pivot grids are *summary* grids - they exist to collapse data into a compact table that reads
 * without horizontal scrolling. Pivot dimensions are therefore low cardinality by nature (`region`
 * with 4-8 values being the canonical case), and pivoting gets chosen precisely because that low
 * cardinality makes for an inefficient tree grouping. The cardinality lives in the *groupings*.
 *
 * So these profiles hold pivot paths and value fields near their realistic values and scale the
 * group-row count, which is what actually grows. The exception is `pathological`, which pivots on a
 * near-unique dimension to find the cliff.
 *
 * See `docs/planning/pivot-grid.md` in hoist-react for the acceptance criteria these feed.
 */

/** Real-ish pools for the low-cardinality dimensions that make good pivots. */
const NAMED_POOLS: Record<string, string[]> = {
    region: [
        'North America',
        'Latin America',
        'UK',
        'Europe ex-UK',
        'Middle East',
        'Africa',
        'Asia ex-Japan',
        'Japan'
    ],
    regionCore: ['Americas', 'EMEA', 'APAC', 'Other'],
    assetClass: ['Equity', 'Credit', 'Rates', 'FX', 'Commodity', 'Cash'],
    assetClassCore: ['Equity', 'Credit', 'Rates', 'FX'],
    tenor: ['Short', 'Medium', 'Long']
};

export interface PivotProfile {
    id: string;
    label: string;

    /** Leaf record count. */
    leaves: number;

    /** Dimension field name -> cardinality. `0` means unique per leaf. */
    dims: Record<string, number>;

    /** Row groupings, innermost last. */
    groupBy: string[];

    /** Pivot dimensions, outermost first. */
    pivotBy: string[];

    valueFields: string[];

    /** Extra numeric measures (`m0`..`mN-1`) beyond pnl/mktVal/quantity, to widen the record. */
    extraMeasures?: number;

    /** True to require an explicit confirm before running - expected to be brutal. */
    optIn?: boolean;

    description: string;
}

const TYPICAL_DIMS = {fund: 10, strategy: 20, sector: 10, region: 8},
    HEAVY_DIMS = {fund: 12, strategy: 25, sector: 13, regionCore: 4, assetClass: 6},
    WIDE_DIMS = {
        fund: 6,
        strategy: 8,
        sector: 6,
        country: 8,
        desk: 4,
        book: 3,
        regionCore: 4,
        assetClassCore: 4,
        tenor: 3
    };

export const PROFILES: PivotProfile[] = [
    {
        id: 'typical',
        label: 'Typical',
        leaves: 35000,
        dims: TYPICAL_DIMS,
        groupBy: ['fund', 'strategy', 'sector'],
        pivotBy: ['region'],
        valueFields: ['pnl'],
        description:
            'The shape real usage takes: 3 groupings, one low-cardinality pivot, one measure. ' +
            'This is the gate.'
    },
    {
        id: 'typicalDrill',
        label: 'Typical + Drill',
        leaves: 35000,
        dims: {...TYPICAL_DIMS, tradeId: 0},
        groupBy: ['fund', 'strategy', 'sector', 'tradeId'],
        pivotBy: ['region'],
        valueFields: ['pnl'],
        description:
            'Typical, plus a unique-per-leaf final grouping for leaf drill-down. A normal ask, so ' +
            'this is a secondary gate.'
    },
    {
        id: 'heavy',
        label: 'Heavy',
        leaves: 100000,
        dims: HEAVY_DIMS,
        groupBy: ['fund', 'strategy', 'sector'],
        pivotBy: ['regionCore', 'assetClass'],
        valueFields: ['pnl', 'mktVal', 'quantity'],
        description:
            'How bad are things on a large dataset: 100k leaves, 24 pivot paths, 3 measures.'
    },
    {
        id: 'heavyDrill',
        label: 'Heavy + Drill',
        leaves: 100000,
        dims: {...HEAVY_DIMS, tradeId: 0},
        groupBy: ['fund', 'strategy', 'sector', 'tradeId'],
        pivotBy: ['regionCore', 'assetClass'],
        valueFields: ['pnl', 'mktVal', 'quantity'],
        description:
            'Heavy with leaf drill-down. The largest dense-cell count short of pathological.'
    },
    {
        id: 'wide',
        label: 'Wide',
        leaves: 35000,
        dims: WIDE_DIMS,
        groupBy: ['fund', 'strategy', 'sector', 'country', 'desk', 'book'],
        pivotBy: ['regionCore', 'assetClassCore', 'tenor'],
        valueFields: ['pnl', 'mktVal'],
        description:
            'Both dials at their practical ceiling: 6 groupings, 3 pivot dimensions (48 paths). ' +
            'Where the dense cost model should hurt most.'
    },
    {
        id: 'wideDrill',
        label: 'Wide + Drill',
        leaves: 35000,
        dims: {...WIDE_DIMS, tradeId: 0},
        groupBy: ['fund', 'strategy', 'sector', 'country', 'desk', 'book', 'tradeId'],
        pivotBy: ['regionCore', 'assetClassCore', 'tenor'],
        valueFields: ['pnl', 'mktVal'],
        description: 'Wide with leaf drill-down.'
    },
    {
        id: 'pathological',
        label: 'Pathological',
        leaves: 35000,
        dims: {...TYPICAL_DIMS, symbol: 5000},
        groupBy: ['fund', 'strategy', 'sector'],
        pivotBy: ['symbol'],
        valueFields: ['pnl'],
        optIn: true,
        description:
            'Typical groupings, but pivoting on a near-unique dimension (5,000 distinct values ' +
            '-> 5,000 pivot paths). Not a target - run this to find where each implementation ' +
            'falls over, so phase 1 can decide what the framework should do about it.'
    }
];

export function getProfile(id: string): PivotProfile {
    const ret = PROFILES.find(it => it.id === id);
    // Callers spread the result, so an undefined return surfaces as `Object.keys(undefined)` deep
    // inside `generateLeaves` rather than here.
    throwIf(!ret, `Unknown pivot profile '${id}'`);
    return ret;
}

/** Seeded PRNG (mulberry32), so every run generates an identical dataset. */
function makeRandom(seed: number) {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Build the value pool for a dimension - named where we have one, generated otherwise. */
function valuePool(name: string, size: number): string[] {
    const named = NAMED_POOLS[name];
    if (named) return named.slice(0, size);

    const prefix = name.charAt(0).toUpperCase() + name.slice(1),
        width = String(size).length;
    return Array.from({length: size}, (_, i) => `${prefix} ${String(i + 1).padStart(width, '0')}`);
}

/**
 * Generate leaf records for a profile. Dimension values come from shared string pools, so they cost
 * one reference per record - the memory being measured is per-record structure, not character data.
 */
export function generateLeaves(profile: PivotProfile): PlainObject[] {
    const rnd = makeRandom(0x91d07),
        {leaves, dims} = profile,
        dimNames = Object.keys(dims),
        pools = dimNames.map(name => (dims[name] === 0 ? null : valuePool(name, dims[name]))),
        extra = profile.extraMeasures ?? 0,
        ret = new Array(leaves);

    for (let r = 0; r < leaves; r++) {
        const rec: PlainObject = {id: r};

        for (let d = 0; d < dimNames.length; d++) {
            const pool = pools[d];
            // A null pool marks a unique-per-leaf dimension - the drill-down case.
            rec[dimNames[d]] = pool ? pool[(rnd() * pool.length) | 0] : `T${r}`;
        }

        rec.pnl = (rnd() - 0.45) * 250000;
        rec.mktVal = rnd() * 5000000;
        rec.quantity = Math.round(rnd() * 25000);
        for (let m = 0; m < extra; m++) {
            rec['m' + m] = rnd() * 100000;
        }

        ret[r] = rec;
    }

    return ret;
}

/**
 * Perturb `count` leaves in place, returning the mutated array. Models a tick: measures move,
 * dimensions do not - so no new pivot path appears and the column structure is unchanged. That
 * values-only case is the one a connected implementation should be able to make cheap.
 */
export function tickLeaves(leaves: PlainObject[], count: number): PlainObject[] {
    const rnd = makeRandom(0x71c1);

    for (let i = 0; i < count; i++) {
        // Stride by a prime so the touched records are spread across the dataset, not clustered.
        const rec = leaves[(i * 7919) % leaves.length];
        rec.pnl = (rnd() - 0.45) * 250000;
        rec.mktVal = rnd() * 5000000;
        rec.quantity = Math.round(rnd() * 25000);
    }

    return leaves;
}
