import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintRegistry, DataCatalog, validateBlueprint} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import {initTestAppAsync} from '@xh/hoist/test-support';
import type {ReactElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {beforeAll, describe, expect, it} from 'vitest';
import catalogJson from '../../../test-support/blueprintsCatalog.json';
import {
    createToolboxRegistry,
    publishToPmPackAction,
    tickerRenderer,
    userFundResolver
} from './toolboxRegistry';
import {weatherIconRenderer} from './WeatherIcon';

const catalog = new DataCatalog(catalogJson);

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
    root: 'grid',
    elements: {
        grid: {
            component: 'cubeGrid',
            config: {source: 'positions', groupBy: ['sector'], columnState: ['mktVal']}
        }
    }
};

const codes = (registry: BlueprintRegistry) =>
    validateBlueprint(fundGrid, {catalog, registry}).map(it => it.code);

beforeAll(() => initTestAppAsync());

describe('Toolbox blueprint registry', () => {
    it('adds the fund type and the userFund resolver to the built-ins', () => {
        expect(codes(new BlueprintRegistry())).toEqual(
            expect.arrayContaining(['variable.unknownType', 'variable.unknownResolver'])
        );
        expect(codes(createToolboxRegistry())).toEqual([]);
    });

    it("resolves userFund to the user's fund preference", () => {
        expect(userFundResolver.resolve({})).toBe('Oak Mount');
        XH.setPref('blueprintsFund', 'Red River');
        expect(userFundResolver.resolve({})).toBe('Red River');
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
});
