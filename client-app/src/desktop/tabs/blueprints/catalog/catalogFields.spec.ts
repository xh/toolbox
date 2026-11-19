import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {DataCatalog, fieldUsages} from '@xh/hoist-chat-kit/blueprint';
import {describe, expect, it} from 'vitest';
import catalogJson from '../../../../test-support/blueprintsCatalog.json';
import p3 from '../scenarios/p3-morning-report.json';
import w2 from '../scenarios/w2-two-cities.json';
import {formatOf} from './CatalogModel';
import {describeFormat} from './catalogFields';

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
                '/elements/headline/config/cards/1/field',
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
