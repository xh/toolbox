import {Icon} from '@xh/hoist/icon';
import {
    ItemKind,
    ItemOption,
    ItemRef,
    ProvidedGroupDef,
    Transform
} from '../../../cmp/groupeditemchooser';

/**
 * Neutral finance sample data for the GroupedItemChooser demo - companies and benchmark indices
 * as two distinct leaf item kinds, a couple of provided (locked) peer groups, and a small library
 * of aggregate transforms. Sample data only - nothing here is part of the component.
 */
const COMPANIES: Record<string, string> = {
    VLO: 'Valero Energy',
    MPC: 'Marathon Petroleum',
    PSX: 'Phillips 66',
    PBF: 'PBF Energy',
    CVI: 'CVR Energy',
    DK: 'Delek US',
    PARR: 'Par Pacific',
    SHEL: 'Shell PLC',
    XOM: 'Exxon Mobil',
    CVX: 'Chevron Corp',
    BP: 'BP PLC'
};

const BENCHMARKS: Record<string, string> = {
    SPX: 'SPX Index',
    XLE: 'XLE US Equity',
    RTY: 'RTY Index',
    CCMP: 'CCMP Index'
};

export function companyRef(ticker: string): ItemRef {
    return {id: ticker, kind: 'company', label: `${ticker} US`, sublabel: COMPANIES[ticker]};
}

export function benchmarkRef(key: string): ItemRef {
    return {id: key, kind: 'benchmark', label: BENCHMARKS[key], sublabel: 'benchmark'};
}

const matches = (query: string, ...terms: string[]) => {
    const q = query?.trim().toLowerCase();
    return !q || terms.some(t => t.toLowerCase().includes(q));
};

export const companyKind: ItemKind = {
    key: 'company',
    label: 'Companies',
    icon: Icon.office(),
    querySource: query =>
        Object.entries(COMPANIES)
            .filter(([ticker, name]) => matches(query, ticker, name))
            .map<ItemOption>(([ticker, name]) => ({
                id: ticker,
                label: `${ticker} US`,
                sublabel: name
            }))
};

export const benchmarkKind: ItemKind = {
    key: 'benchmark',
    label: 'Benchmarks',
    icon: Icon.chartLine(),
    querySource: query =>
        Object.entries(BENCHMARKS)
            .filter(([key, label]) => matches(query, key, label))
            .map<ItemOption>(([key, label]) => ({id: key, label, sublabel: 'benchmark'}))
};

export const sampleTransforms: Transform[] = [
    {key: 'avg', label: 'Avg', shortLabel: 'AVG', isAggregate: true},
    {key: 'median', label: 'Med', shortLabel: 'MED', isAggregate: true}
];

export const sampleProvidedGroups: ProvidedGroupDef[] = [
    {
        id: 'us-refiners',
        label: 'US Refiners',
        members: ['CVI', 'DK', 'MPC', 'PARR', 'PBF', 'PSX', 'VLO'].map(companyRef),
        transformKey: 'avg'
    },
    {
        id: 'energy-peers',
        label: 'Energy Sector Peers',
        members: ['VLO', 'MPC', 'PSX', 'PBF', 'DK', 'CVI', 'PARR', 'XOM', 'CVX'].map(companyRef),
        transformKey: 'avg'
    }
];

export const sampleAnchor: ItemRef = {
    id: 'DINO',
    kind: 'company',
    label: 'DINO US',
    sublabel: 'HF Sinclair Corp'
};
