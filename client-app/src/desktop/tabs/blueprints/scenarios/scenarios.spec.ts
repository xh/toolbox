import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {DataCatalog, validateBlueprint} from '@xh/hoist-chat-kit/blueprint';
import {initTestAppAsync} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it} from 'vitest';
import catalogJson from '../../../../test-support/blueprintsCatalog.json';
import {createToolboxRegistry} from '../toolboxRegistry';
import p1 from './p1-one-grid.json';
import p2 from './p2-linked-dashboard.json';
import p3 from './p3-morning-report.json';
import p5 from './p5-risk-report.json';
import s3 from './s3-joins-showcase.json';
import s4 from './s4-inputs-showcase.json';
import s5 from './s5-weather-showcase.json';
import w1 from './w1-one-city.json';
import w2 from './w2-two-cities.json';

/** Every blueprint the server seeds as a preset, from `BlueprintPresetService.PRESETS`. */
const SCENARIOS: Record<string, unknown> = {p1, p2, p3, p5, w1, w2, s3, s4, s5};

beforeAll(() => initTestAppAsync());

describe('scenario blueprints', () => {
    it.each(Object.keys(SCENARIOS))('%s validates with no issues', name => {
        const catalog = new DataCatalog(catalogJson as any),
            issues = validateBlueprint(SCENARIOS[name] as Blueprint, {
                catalog,
                registry: createToolboxRegistry()
            });
        expect(issues.map(it => `${it.severity} ${it.code} ${it.path}: ${it.message}`)).toEqual([]);
    });
});
