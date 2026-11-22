import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {DataCatalog, fieldUsages} from '@xh/hoist-chat-kit/blueprint';
import type {PlainObject} from '@xh/hoist/core';
import {describe, expect, it} from 'vitest';
import catalogJson from '../../test-support/blueprintsCatalog.json';
import p3 from '../scenarios/p3-morning-report.json';
import w2 from '../scenarios/w2-two-cities.json';
import {fieldTree, formatOf} from './CatalogModel';
import {
    catalogEntries,
    datasetJoins,
    datasetUsers,
    describeFormat,
    fieldsByKind,
    matchDatasets,
    sampleValues
} from './catalogFields';

const catalog = new DataCatalog(catalogJson as any),
    field = (dataset: string, name: string) => catalog.getDataset(dataset).fields[name],
    usedNames = (usages: ReturnType<typeof fieldUsages>, dataset: string) =>
        Object.keys(usages[dataset] ?? {}).sort();

describe('field resolution', () => {
    it('resolves a format through the kind', () => {
        expect(formatOf(field('positions', 'pnlDay'), catalog)).toEqual({
            precision: 0,
            ledger: true,
            colorSpec: true,
            tooltip: true
        });
        expect(formatOf(field('positions', 'mktVal'), catalog)).toEqual({
            scale: 'millions',
            precision: 1,
            ledger: true
        });
        expect(formatOf(field('positions', 'pctNav'), catalog)).toEqual({precision: 2});
    });

    it('starts from the built-in default of the base kind', () => {
        expect(formatOf(field('positions', 'dv01'), catalog)).toEqual({precision: 2});
        expect(formatOf(field('positions', 'quantity'), catalog)).toEqual({
            precision: 0
        });
    });

    it("lets a field's own format override its kind's", () => {
        const small = new DataCatalog({
            formats: {pnl: {precision: 0, ledger: true}},
            kinds: {pnl: {base: 'currency:USD', format: 'pnl', aggregator: 'SUM'}},
            datasets: {
                ds: {
                    params: {},
                    fields: [
                        {name: 'a', type: 'number', kind: 'pnl'},
                        {name: 'b', type: 'number', kind: 'pnl', format: {precision: 2}},
                        {name: 'c', type: 'number', kind: 'pnl', aggregator: 'MAX'}
                    ]
                }
            }
        });
        const f = (name: string) => small.getDataset('ds').fields[name];
        expect(formatOf(f('a'), small)).toEqual({precision: 0, ledger: true});
        expect(formatOf(f('b'), small)).toEqual({precision: 2, ledger: true});
        expect(f('a').aggregator).toBe('SUM');
        expect(f('c').aggregator).toBe('MAX');
    });

    it('resolves an aggregator through the kind', () => {
        expect(field('positions', 'pnlDay').aggregator).toBe('SUM');
        expect(field('weather', 'temp').aggregator).toBe('AVG');
        expect(field('positions', 'quantity').aggregator).toBe('UNIQUE');
    });

    it('describes a format in one line', () => {
        expect(describeFormat({scale: 'millions', precision: 1, ledger: true})).toBe(
            'scale: millions, precision: 1, ledger'
        );
        expect(describeFormat({})).toBe('');
    });
});

describe('used-field marks', () => {
    const usages = fieldUsages(p3 as Blueprint, catalog);

    it("marks each widget's fields on its source's dataset", () => {
        expect(usedNames(usages, 'positions')).toEqual(
            expect.arrayContaining(['mktVal', 'pnlDay', 'pnlMtd', 'pnlYtd', 'sector', 'region'])
        );
        expect(usedNames(usages, 'orders')).toEqual([
            'commission',
            'dir',
            'mktVal',
            'price',
            'quantity',
            'symbol',
            'time',
            'trader'
        ]);
        expect(usedNames(usages, 'prices')).toEqual(['close', 'day']);
    });

    it('records every place a field is used', () => {
        expect(usages.positions.pnlDay.map(it => it.path)).toEqual(
            expect.arrayContaining([
                '/elements/headlinePnlDay/config/field',
                '/elements/sectorChart/config/y/0',
                '/elements/posGrid/config/sortBy',
                '/elements/pnlButtons/config/buttons/0/action/value/field'
            ])
        );
    });

    it('follows variables to the dataset that reads them', () => {
        // The grouping chooser writes `grouping`, which only the positions grid reads.
        expect(usedNames(usages, 'positions')).toEqual(
            expect.arrayContaining(['fund', 'strategy', 'trader', 'symbol'])
        );
        expect(usages.positions.strategy.map(it => it.path)).toEqual(
            expect.arrayContaining([
                '/elements/groupChooser/config/dimensions/1',
                '/variables/grouping/default/value/0'
            ])
        );
        expect(usedNames(usages, 'orders')).not.toContain('sector');
        expect(usages.positions.symbol.map(it => it.path)).toContain(
            '/variables/symbol/setBy/field'
        );
    });

    it('marks a field instance on its base field', () => {
        expect(usages.positions.return).toEqual([
            {
                path: '/sources/positions/fields/retYtd',
                instance: 'retYtd',
                params: {start: {$var: 'yearStart'}, end: {$var: 'asOf'}}
            }
        ]);
    });

    it('marks fields across sources over the same dataset', () => {
        const weather = fieldUsages(w2 as Blueprint, catalog);
        expect(usedNames(weather, 'currentWeather')).toEqual([
            'conditions',
            'feelsLike',
            'humidity',
            'temp',
            'windSpeed'
        ]);
        expect(usedNames(weather, 'weather')).toEqual([
            'conditions',
            'feelsLike',
            'precipProbability',
            'precipVolume',
            'temp',
            'time',
            'windGust',
            'windSpeed'
        ]);
        expect(weather.weather.temp.length).toBe(4);
    });

    it('marks nothing for an empty blueprint', () => {
        expect(fieldUsages(null, catalog)).toEqual({});
    });
});

describe('field tree', () => {
    const bp = {
            root: 'grid',
            sources: {
                pos: {
                    dataset: 'positions',
                    params: {asOf: '2026-11-19'},
                    fields: {
                        pnlDay: {label: 'Today', align: 'center', format: {precision: 2}},
                        shock10: {field: 'shockedPnl', params: {shock: -0.1}, label: 'P&L -10%'}
                    }
                }
            },
            elements: {
                grid: {
                    component: 'cubeGrid',
                    config: {source: 'pos', columnState: ['pnlDay', 'shock10']}
                }
            }
        } as unknown as Blueprint,
        rows = () => {
            const usages = fieldUsages(bp, catalog);
            return flatten(
                fieldTree(catalog.getDataset('positions'), catalog, usages.positions, bp)
            );
        },
        row = (id: string) => rows().find(it => it.id === id);

    it("shows a field as the catalog defines it, with the catalog's label and alignment", () => {
        const f = field('positions', 'pnlDay');
        expect(row('field:pnlDay')).toMatchObject({label: f.label, align: f.align ?? null});
    });

    it('adds a row for each source that overrides the field, with its display resolved', () => {
        expect(row('override:pos:pnlDay')).toMatchObject({
            name: 'pos',
            role: 'Override',
            label: 'Today',
            align: 'center',
            usedAt: '/sources/pos/fields/pnlDay'
        });
        expect(row('override:pos:pnlDay').format).toContain('precision: 2');
    });

    it("labels a field instance with the source's label for it", () => {
        expect(row('instance:shockedPnl:shock10')).toMatchObject({label: 'P&L -10%'});
    });
});

function flatten(nodes: PlainObject[]): PlainObject[] {
    return nodes.flatMap(it => [it, ...flatten(it.children ?? [])]);
}

describe('datasetJoins', () => {
    const joins = (name: string) => datasetJoins(catalog, catalog.getDataset(name));

    it('lists the datasets whose key fields this one has as dimensions', () => {
        expect(joins('positions')).toEqual([
            {dataset: 'fundSummary', on: ['fund']},
            {dataset: 'prices', on: ['symbol']},
            {dataset: 'hypotheticalPortfolio', on: ['symbol']}
        ]);
        expect(joins('fundSummary')).toEqual([{dataset: 'positions', on: ['fund']}]);
        expect(joins('orders')).toEqual([
            {dataset: 'positions', on: ['fund', 'strategy', 'book', 'trader', 'model', 'symbol']},
            {dataset: 'fundSummary', on: ['fund']},
            {dataset: 'prices', on: ['symbol']},
            {dataset: 'hypotheticalPortfolio', on: ['symbol']}
        ]);
        expect(joins('weather')).toEqual([{dataset: 'currentWeather', on: ['city']}]);
    });
});

describe('matchDatasets', () => {
    const datasets = Object.values(catalog.datasets);

    it('lists every dataset, with no field hits, for no query', () => {
        expect(matchDatasets(datasets, '').map(it => it.name)).toEqual(datasets.map(it => it.name));
        expect(matchDatasets(datasets, '  ').every(it => !it.fieldHits.length)).toBe(true);
    });

    it('matches a dataset by name, label or description, ignoring case', () => {
        expect(matchDatasets(datasets, 'HOLDINGS').map(it => it.name)).toEqual(['positions']);
        expect(matchDatasets(datasets, 'fundsum').map(it => it.name)).toEqual(['fundSummary']);
    });

    it('matches by field, and names the fields hit', () => {
        const hit = matchDatasets(datasets, 'pnlDay').find(it => it.name === 'positions');
        expect(hit.fieldHits).toContain('pnlDay');
    });
});

describe('datasetUsers', () => {
    it('lists the sources over a dataset, and the widgets that read them', () => {
        expect(datasetUsers(p3 as Blueprint, 'positions')).toEqual({
            sources: ['positions'],
            elements: [
                'headlineMktVal',
                'headlinePnlDay',
                'headlinePnlMtd',
                'headlinePnlYtd',
                'sectorChart',
                'regionChart',
                'posGrid'
            ]
        });
        expect(datasetUsers(p3 as Blueprint, 'fundSummary')).toEqual({sources: [], elements: []});
        expect(datasetUsers(null, 'positions')).toEqual({sources: [], elements: []});
    });
});

describe('catalogEntries', () => {
    it('lists datasets, kinds and formats as sections, in catalog order', () => {
        const rows = catalogEntries(catalog, '', {});
        expect(rows.filter(it => it.kind === 'dataset').map(it => it.name)).toEqual(
            Object.keys(catalog.datasets)
        );
        expect(rows.some(it => it.kind === 'kind')).toBe(true);
        expect(rows.some(it => it.kind === 'format')).toBe(true);
        expect(rows.find(it => it.id === 'kind:pnl')).toMatchObject({
            section: 'Kinds',
            meta: 'currency:USD'
        });
    });

    it('filters all three with one query, a field hit showing under its dataset', () => {
        const rows = catalogEntries(catalog, 'pnl', {});
        expect(rows.find(it => it.id === 'dataset:positions')?.meta).toMatch(
            /pnlDay.* in positions/
        );
        expect(rows.some(it => it.id === 'kind:pnl')).toBe(true);
        expect(rows.some(it => it.id === 'format:pnl')).toBe(true);
        expect(rows.some(it => it.id === 'kind:marketValue')).toBe(false);
    });

    it("shows a dataset's used-field count without a query", () => {
        const usages = fieldUsages(p3 as Blueprint, catalog),
            row = catalogEntries(catalog, '', usages).find(it => it.id === 'dataset:positions');
        expect(row.meta).toMatch(/^\d+ used$/);
    });
});

describe('fieldsByKind', () => {
    it('regroups the field tree by kind, kinds sorted, fields with none last', () => {
        const tree = [
                {
                    id: 'cat:P&L',
                    name: 'P&L',
                    children: [{id: 'field:pnlDay', name: 'pnlDay', kind: 'pnl', children: []}]
                },
                {id: 'field:symbol', name: 'symbol', kind: null, children: []},
                {id: 'field:mktVal', name: 'mktVal', kind: 'marketValue', children: []}
            ],
            grouped = fieldsByKind(tree, catalog);
        expect(grouped.map(it => [it.name, it.children.map(c => c.name)])).toEqual([
            ['marketValue', ['mktVal']],
            ['pnl', ['pnlDay']],
            ['No kind', ['symbol']]
        ]);
    });
});

describe('catalog list scope', () => {
    it("lists only the kinds and formats its datasets' fields use", () => {
        const portfolio = new DataCatalog({
                ...(catalogJson as any),
                datasets: {positions: (catalogJson as any).datasets.positions}
            }),
            rows = catalogEntries(portfolio, '', {}),
            kinds = rows.filter(it => it.kind === 'kind').map(it => it.name),
            formats = rows.filter(it => it.kind === 'format').map(it => it.name);
        expect(kinds).toContain('pnl');
        expect(kinds).not.toContain('temperature');
        expect(formats).toContain('mv');
        expect(formats).not.toContain('temp');
    });
});

describe('fieldsByKind labels', () => {
    it('names a base kind no catalog kind defines as a base', () => {
        const grouped = fieldsByKind(
            [{id: 'field:x', name: 'x', kind: 'currency:USD', children: []}],
            catalog
        );
        expect(grouped[0].name).toBe('currency:USD (base)');
    });
});

describe('sampleValues', () => {
    it('scales a positive, a negative and a large sample to the format', () => {
        expect(sampleValues({scale: 'millions', precision: 1})).toEqual([
            12345678.9, -9876543.2, 123456789
        ]);
        expect(sampleValues({scale: 'thousands'})).toEqual([12345.6, -9876.5, 1234567]);
        expect(sampleValues({precision: 2})).toEqual([1234.56, -987.65, 1234567.89]);
    });
});
