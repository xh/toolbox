import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {
    BlueprintRegistry,
    DataCatalog,
    runAsyncChecksAsync,
    validateBlueprint
} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import type {ReactElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeAll, describe, expect, it} from 'vitest';
import catalogJson from '../test-support/blueprintsCatalog.json';
import {
    createToolboxRegistry,
    publishToPmPackAction,
    tickerRenderer,
    userFundResolver
} from './toolboxRegistry';
import {weatherIconRenderer} from './WeatherIcon';

const catalog = new DataCatalog(catalogJson as any);

const fundGrid: Blueprint = {
    variables: {
        asOf: {type: 'localDate', label: 'As of', setBy: 'prompt', default: {resolver: 'today'}},
        fund: {
            type: 'toolbox.fund',
            label: 'Fund',
            setBy: 'prompt',
            default: {resolver: 'toolbox.userFund'}
        }
    },
    sources: {
        positions: {
            dataset: 'positions',
            params: {asOf: {$var: 'asOf'}, fund: {$var: 'fund'}}
        }
    },
    root: 'page',
    elements: {
        page: {
            component: 'panel',
            tbar: [{id: 'fundInput'}, {id: 'asOfInput'}],
            children: [{id: 'grid'}]
        },
        fundInput: {component: 'variableInput', config: {variable: 'fund'}},
        asOfInput: {component: 'variableInput', config: {variable: 'asOf'}},
        grid: {
            component: 'cubeGrid',
            config: {source: 'positions', groupBy: ['sector'], columnState: ['mktVal']}
        }
    }
};

const codes = (registry: BlueprintRegistry) =>
    validateBlueprint(fundGrid, {catalog, registry}).map(it => it.code);

beforeAll(async () => {
    await initTestAppAsync();
    hoistCore.route('GET', 'blueprints/symbols', () => [
        {symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology'},
        {symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology'}
    ]);
});

describe('Toolbox blueprint registry', () => {
    it('adds the fund type and the userFund resolver to the built-ins', () => {
        expect(codes(new BlueprintRegistry())).toEqual(
            expect.arrayContaining(['variable.unknownType', 'variable.unknownResolver'])
        );
        expect(codes(createToolboxRegistry())).toEqual([]);
    });

    it("resolves userFund to the user's fund preference", () => {
        const context = {registry: createToolboxRegistry()};
        expect(userFundResolver.resolve({}, context)).toBe('Oak Mount');
        XH.setPref('blueprintsFund', 'Red River');
        expect(userFundResolver.resolve({}, context)).toBe('Red River');
        XH.prefService.unset('blueprintsFund');
    });
});

describe('ticker renderer', () => {
    const draw = (value: string) =>
        renderToStaticMarkup(tickerRenderer.render(value, null) as ReactElement);

    it('emphasizes the root ticker and mutes any contract detail', () => {
        expect(draw('ZDVTT FUT SEP27')).toBe(
            '<span class="tb-ticker"><span class="tb-ticker__root">ZDVTT</span>' +
                '<span class="tb-ticker__detail"> FUT SEP27</span></span>'
        );
        expect(draw('AAPL')).toBe(
            '<span class="tb-ticker"><span class="tb-ticker__root">AAPL</span></span>'
        );
    });
});

describe('weatherIcon renderer', () => {
    const draw = (value: string) =>
        renderToStaticMarkup(
            weatherIconRenderer.render(value, {formatValue: v => v} as any) as ReactElement
        );

    it('draws a known condition with its own icon, and its name', () => {
        expect(draw('Rain')).toContain('data-icon="cloud-rain"');
        expect(draw('Rain')).toContain('<span>Rain</span>');
        expect(draw('Clear')).toContain('data-icon="sun"');
    });

    it('draws a condition it does not know with a general icon', () => {
        expect(draw('Haze')).toContain('data-icon="cloud-sun"');
        expect(draw('Haze')).toContain('<span>Haze</span>');
    });
});

describe('publishToPmPack action', () => {
    it('asks first, and describes the fund and date it publishes', () => {
        expect(createToolboxRegistry().actions['toolbox.publishToPmPack'].sideEffects).toBe(true);
        expect(publishToPmPackAction.describe({fund: 'Oak Mount', asOf: '2026-11-18'})).toBe(
            'Publish the report for Oak Mount, 2026-11-18'
        );
        expect(publishToPmPackAction.describe({fund: null, asOf: '2026-11-18'})).toBe(
            'Publish the report for all funds, 2026-11-18'
        );
    });

    it("checks a portfolio variable's literal holdings against the server's symbols", async () => {
        const portfolio = (symbols: string[]) => ({
                holdings: symbols.map(symbol => ({symbol, weight: 1 / symbols.length}))
            }),
            withDefault = (symbols: string[]): Blueprint => ({
                variables: {
                    portfolio: {
                        type: 'toolbox.portfolio',
                        setBy: 'prompt',
                        default: {value: portfolio(symbols)}
                    }
                },
                root: 'page',
                elements: {page: {component: 'panel'}}
            }),
            registry = createToolboxRegistry();

        expect(await runAsyncChecksAsync(null, withDefault(['AAPL', 'MSFT']), registry)).toEqual(
            []
        );
        expect(await runAsyncChecksAsync(null, withDefault(['AAPL', 'ZZZZ']), registry)).toEqual([
            {
                code: 'variable.badValue',
                severity: 'error',
                path: '/variables/portfolio/default/value',
                message: expect.stringContaining('ZZZZ')
            }
        ]);
        expect(await runAsyncChecksAsync(null, withDefault(['AAPL', '', ' ']), registry)).toEqual(
            []
        );
    });

    it('offers the Architect a client tool that looks up tickers by company name', async () => {
        const tool = createToolboxRegistry().tools['toolbox.lookupSymbol'],
            lookup = (query: string) => tool.execute({query}, {target: null});

        expect(tool.runsOn).toBe('client');
        expect(await lookup('microsoft')).toEqual([
            {symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology'}
        ]);
        expect(await lookup('aapl')).toEqual([
            {symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology'}
        ]);
        expect(await lookup('Acme')).toEqual([]);
        await expect(lookup(' ')).rejects.toThrow(/company name/);
    });

    it("checks a portfolio variable's literal default against the type's schema", () => {
        const withDefault = (value: unknown): Blueprint => ({
                variables: {
                    portfolio: {type: 'toolbox.portfolio', setBy: 'prompt', default: {value}}
                },
                root: 'page',
                elements: {page: {component: 'panel'}}
            }),
            codes = (value: unknown) =>
                validateBlueprint(withDefault(value), {catalog, registry: createToolboxRegistry()})
                    .map(it => it.code)
                    .filter(it => it !== 'variable.noInput');

        expect(codes({holdings: [{symbol: 'AAPL', weight: 1}]})).toEqual([]);
        expect(codes({holdings: [{symbol: 'AAPL'}]})).toEqual(['variable.badValue']);
        expect(codes({positions: []})).toEqual(['variable.badValue']);
    });
});
