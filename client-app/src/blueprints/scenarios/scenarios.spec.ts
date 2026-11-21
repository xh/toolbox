import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {DataCatalog, validateBlueprint} from '@xh/hoist-chat-kit/blueprint';
import {pick} from 'lodash';
import {initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it} from 'vitest';
import catalogJson from '../../test-support/blueprintsCatalog.json';
import {PORTFOLIO_TYPE, WEATHER_TYPE} from '../blueprintTypes';
import type {BlueprintTypeSpec} from '../blueprintTypes';
import d1 from './d1-symbol-detail.json';
import p1 from './p1-one-grid.json';
import p2 from './p2-linked-dashboard.json';
import p3 from './p3-morning-report.json';
import p5 from './p5-risk-report.json';
import s1 from './s1-overview-showcase.json';
import s2 from './s2-risk-time-showcase.json';
import s3 from './s3-joins-showcase.json';
import s4 from './s4-inputs-showcase.json';
import s5 from './s5-weather-showcase.json';
import w1 from './w1-one-city.json';
import w2 from './w2-two-cities.json';
import w3 from './w3-new-york.json';
import w4 from './w4-new-york-london.json';
import w5 from './w5-global-comparison.json';

/** Every blueprint the server seeds as a preset, from `BlueprintPresetService.PRESETS`, by type. */
const SCENARIOS: Record<string, [unknown, BlueprintTypeSpec]> = {
    p1: [p1, PORTFOLIO_TYPE],
    p2: [p2, PORTFOLIO_TYPE],
    p3: [p3, PORTFOLIO_TYPE],
    p5: [p5, PORTFOLIO_TYPE],
    s1: [s1, PORTFOLIO_TYPE],
    s2: [s2, PORTFOLIO_TYPE],
    s3: [s3, PORTFOLIO_TYPE],
    s4: [s4, PORTFOLIO_TYPE],
    d1: [d1, PORTFOLIO_TYPE],
    w1: [w1, WEATHER_TYPE],
    w2: [w2, WEATHER_TYPE],
    w3: [w3, WEATHER_TYPE],
    w4: [w4, WEATHER_TYPE],
    w5: [w5, WEATHER_TYPE],
    s5: [s5, WEATHER_TYPE]
};

beforeAll(() => initTestAppAsync());

describe('scenario blueprints', () => {
    it.each(Object.keys(SCENARIOS))("%s validates with no issues, in its type's terms", name => {
        const [blueprint, type] = SCENARIOS[name],
            json = catalogJson as any,
            catalog = new DataCatalog({...json, datasets: pick(json.datasets, type.datasets)}),
            issues = validateBlueprint(blueprint as Blueprint, {
                catalog,
                registry: type.createRegistry()
            });
        expect(issues.map(it => `${it.severity} ${it.code} ${it.path}: ${it.message}`)).toEqual([]);
    });
});
