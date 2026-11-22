import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {DataCatalog, validateBlueprint} from '@xh/hoist-chat-kit/blueprint';
import {describe, expect, it} from 'vitest';
import catalogJson from '../test-support/blueprintsCatalog.json';
import d1SymbolDetail from './scenarios/d1-symbol-detail.json';
import p1OneGrid from './scenarios/p1-one-grid.json';
import p2LinkedDashboard from './scenarios/p2-linked-dashboard.json';
import p3MorningReport from './scenarios/p3-morning-report.json';
import p5RiskReport from './scenarios/p5-risk-report.json';
import s1OverviewShowcase from './scenarios/s1-overview-showcase.json';
import s2RiskTimeShowcase from './scenarios/s2-risk-time-showcase.json';
import s3JoinsShowcase from './scenarios/s3-joins-showcase.json';
import s4InputsShowcase from './scenarios/s4-inputs-showcase.json';
import s5WeatherShowcase from './scenarios/s5-weather-showcase.json';
import w1OneCity from './scenarios/w1-one-city.json';
import w2TwoCities from './scenarios/w2-two-cities.json';
import w3NewYork from './scenarios/w3-new-york.json';
import w4NewYorkLondon from './scenarios/w4-new-york-london.json';
import w5GlobalComparison from './scenarios/w5-global-comparison.json';
import {createPortfolioRegistry, createWeatherRegistry} from './toolboxRegistry';

const catalog = new DataCatalog(catalogJson as any),
    portfolio = createPortfolioRegistry(),
    weather = createWeatherRegistry();

// Every seed file, as the server reads it.
const SEEDS: Record<string, unknown> = {
    'd1-symbol-detail': d1SymbolDetail,
    'p1-one-grid': p1OneGrid,
    'p2-linked-dashboard': p2LinkedDashboard,
    'p3-morning-report': p3MorningReport,
    'p5-risk-report': p5RiskReport,
    's1-overview-showcase': s1OverviewShowcase,
    's2-risk-time-showcase': s2RiskTimeShowcase,
    's3-joins-showcase': s3JoinsShowcase,
    's4-inputs-showcase': s4InputsShowcase,
    's5-weather-showcase': s5WeatherShowcase,
    'w1-one-city': w1OneCity,
    'w2-two-cities': w2TwoCities,
    'w3-new-york': w3NewYork,
    'w4-new-york-london': w4NewYorkLondon,
    'w5-global-comparison': w5GlobalComparison
};

describe('scenario files', () => {
    it('validates each seed as stored, with no errors', () => {
        const problems = Object.entries(SEEDS).flatMap(([name, bp]) => {
            const registry = /^(w\d|s5)/.test(name) ? weather : portfolio;
            return validateBlueprint(bp as Blueprint, {registry, catalog})
                .filter(it => it.severity === 'error')
                .map(it => `${name}: ${it.code} ${it.path} ${it.message}`);
        });
        expect(problems).toEqual([]);
    });
});
