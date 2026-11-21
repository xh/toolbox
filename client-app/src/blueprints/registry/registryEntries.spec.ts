import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {DataCatalog, registryUsages} from '@xh/hoist-chat-kit/blueprint';
import {chatUiStackSpec, chatUiTextSpec} from '@xh/hoist-chat-kit/desktop/cmp/genui';
import {ChatUiCatalog} from '@xh/hoist-chat-kit/genui';
import {describe, expect, it} from 'vitest';
import catalogJson from '../../test-support/blueprintsCatalog.json';
import p3 from '../scenarios/p3-morning-report.json';
import w2 from '../scenarios/w2-two-cities.json';
import {createToolboxRegistry} from '../toolboxRegistry';
import {registryEntries} from './registryEntries';

const catalog = new DataCatalog(catalogJson as any),
    dashboard = createToolboxRegistry(),
    answers = new ChatUiCatalog({
        components: [chatUiStackSpec(), chatUiTextSpec()],
        modes: ['document'],
        answers: {registry: dashboard, dataCatalog: catalog}
    }).registry,
    originOf = (entries: ReturnType<typeof registryEntries>, id: string) =>
        entries.find(it => it.id === id)?.origin;

describe('registry origins', () => {
    const dash = registryEntries(dashboard, dashboard),
        ans = registryEntries(answers, dashboard);

    it("tells the app's entries from the built-ins", () => {
        expect(originOf(dash, 'widget:cubeGrid')).toBe('built-in');
        expect(originOf(dash, 'widget:toolbox.portfolioBuilder')).toBe('app');
        expect(originOf(dash, 'variableType:toolbox.fund')).toBe('app');
        expect(originOf(dash, 'resolver:today')).toBe('built-in');
        expect(originOf(dash, 'resolver:toolbox.userFund')).toBe('app');
        expect(originOf(dash, 'action:setVariable')).toBe('built-in');
        expect(originOf(dash, 'action:toolbox.publishToPmPack')).toBe('app');
        expect(originOf(dash, 'renderer:bar')).toBe('built-in');
        expect(originOf(dash, 'renderer:toolbox.ticker')).toBe('app');
        expect(dash.some(it => it.origin === 'chat kit')).toBe(false);
    });

    it("marks chat kit's bridged components, actions and presentations in the answer registry", () => {
        // Text and stack translate to markdown and box, so their bridges stay out of answers.
        expect(originOf(ans, 'widget:stack')).toBeUndefined();
        expect(originOf(ans, 'widget:text')).toBeUndefined();
        expect(originOf(ans, 'presentation:chart.card')).toBe('chat kit');
        expect(ans.some(it => it.kind === 'action' && it.origin === 'chat kit')).toBe(true);
    });

    it('keeps built-ins and app entries as such in the answer registry', () => {
        // Adding a presentation copies the widget's spec, which stays a built-in.
        expect(originOf(ans, 'widget:chart')).toBe('built-in');
        expect(originOf(ans, 'widget:toolbox.portfolioBuilder')).toBe('app');
        expect(originOf(ans, 'action:toolbox.publishToPmPack')).toBe('app');
    });
});

describe('registry used marks', () => {
    const usages = registryUsages(p3 as Blueprint, dashboard, catalog);

    it('marks the widgets each element is', () => {
        expect(usages['widget:tileFrame']).toEqual(['/elements/headline/component']);
        expect(usages['widget:statCard']).toHaveLength(4);
        expect(
            Object.keys(usages)
                .filter(it => it.startsWith('widget:'))
                .sort()
        ).toEqual([
            'widget:buttonGroup',
            'widget:chart',
            'widget:cubeGrid',
            'widget:dashCanvas',
            'widget:groupingChooser',
            'widget:presetSelector',
            'widget:statCard',
            'widget:tabContainer',
            'widget:tileFrame'
        ]);
    });

    it('marks resolvers, actions and variable types', () => {
        expect(usages['resolver:toolbox.userFund']).toEqual(['/variables/fund/default/resolver']);
        expect(usages['resolver:dateOffset']).toEqual(['/variables/priceStart/compute/resolver']);
        expect(usages['action:toolbox.publishToPmPack']).toEqual([
            '/elements/reportActions/config/buttons/0/action/type'
        ]);
        expect(usages['action:setVariable']).toHaveLength(2);
        expect(usages['action:resetVariable']).toHaveLength(1);
        expect(usages['variableType:toolbox.fund']).toEqual(['/variables/fund/type']);
        expect(usages['action:openUrl']).toBeUndefined();
    });

    it('marks a renderer through the fields that use it', () => {
        expect(usages['renderer:toolbox.ticker']).toContain('positions.symbol');
        const weather = registryUsages(w2 as Blueprint, dashboard, catalog);
        expect(weather['renderer:toolbox.weatherIcon']).toEqual(
            expect.arrayContaining(['weather.conditions', 'currentWeather.conditions'])
        );
    });

    it('marks a presentation an element draws with', () => {
        const bp = {
            root: 'c',
            sources: {s: {dataset: 'positions', params: {asOf: '2026-11-19'}}},
            elements: {
                c: {
                    component: 'chart',
                    config: {source: 's', x: 'sector', y: ['pnlDay'], presentation: 'card'}
                }
            }
        };
        expect(registryUsages(bp, answers, catalog)['presentation:chart.card']).toEqual([
            '/elements/c/config/presentation'
        ]);
    });
});
