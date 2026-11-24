import {DataCatalog} from '@xh/hoist-chat-kit/blueprint';
import {describe, expect, it} from 'vitest';
import {createPortfolioRegistry} from '../../../../blueprints/toolboxRegistry';
import catalogJson from '../../../../test-support/blueprintsCatalog.json';
import {builtinExample} from './builtinExamples';
import {builtinSettings, minColumns, settingValue, withSetting} from './builtinSettings';

const registry = createPortfolioRegistry(),
    catalog = new DataCatalog(catalogJson as any),
    settingsOf = (name: string) => builtinSettings({...registry.widgets[name], name}),
    settingOf = (name: string, key: string) => settingsOf(name).find(it => it.key === key),
    widgetOf = (bp: any, name: string) =>
        Object.values<any>(bp.elements).find(it => it.component === name),
    minWidth = () => 1;

describe('builtinSettings', () => {
    it("takes a widget's simple settings by their x-group, in the setting groups' order", () => {
        const settings = settingsOf('dashboard'),
            order = ['Data', 'List', 'Content', 'Appearance', 'Behavior', 'Layout', 'Children'],
            sections = [...new Set(settings.map(it => it.section))];
        expect(settings.map(it => it.key)).toEqual(
            expect.arrayContaining(['columns', 'rowHeight'])
        );
        expect(sections).toEqual([...sections].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
        expect(settings.at(-1)).toMatchObject({key: 'hideHeader', kind: 'bool'});
    });

    it('marks settings that apply to each child', () => {
        const hideHeader = settingsOf('dashboard').find(it => it.key === 'hideHeader');
        expect(hideHeader.perChild).toBe(true);
    });

    it('offers choices without the bare true, with their thumbnails', () => {
        const summary = settingsOf('cubeGrid').find(it => it.key === 'showSummary');
        expect(summary.kind).toBe('choice');
        expect(summary.options).toEqual(['top', 'bottom', false]);
        expect(summary.thumbnails).toBeTruthy();
    });

    it('leaves out field names and bindings to data, and keeps advanced settings', () => {
        const keys = settingsOf('cubeGrid').map(it => it.key);
        expect(keys).not.toContain('source');
        expect(keys).not.toContain('groupBy');
        expect(keys).toContain('stripeRows');
    });

    it('shows a setting named for its negative positive first', () => {
        const hideHeader = settingsOf('dashboard').find(it => it.key === 'hideHeader');
        expect(hideHeader).toMatchObject({
            label: 'Cell headers',
            boolOptions: [
                {value: false, label: 'Show'},
                {value: true, label: 'Hide'}
            ]
        });
    });

    it("takes a boolean's labels from x-labels, as the Inspector does", () => {
        const counts = settingsOf('cubeGrid').find(it => it.key === 'showGroupRowCounts');
        expect(counts.boolOptions.map(it => it.label)).toEqual(['Show', 'Hide']);
    });

    it('offers an intent as an intent', () => {
        expect(settingsOf('statCard').find(it => it.key === 'intent').kind).toBe('intent');
    });

    it('labels a setting by its title, else its key in words', () => {
        const byKey = Object.fromEntries(settingsOf('dashboard').map(it => [it.key, it.label]));
        expect(byKey.compact).toBe('Packing');
        expect(byKey.columns).toBe('Columns');
    });
});

describe('withSetting', () => {
    it("sets the page's widget in its example, not the panel around it", () => {
        const example = builtinExample('statCard', registry, catalog),
            intent = settingOf('statCard', 'intent'),
            next = withSetting(example, 'statCard', intent, 'success', minWidth);
        expect(widgetOf(next, 'statCard').config.intent).toBe('success');
        expect(next.elements[next.root].config?.intent).toBeUndefined();
        expect(settingValue(next, 'statCard', intent)).toBe('success');
    });

    it("sets a per-child setting on each of the widget's child references", () => {
        const example = builtinExample('dashboard', registry, catalog),
            hideHeader = settingOf('dashboard', 'hideHeader'),
            next = withSetting(example, 'dashboard', hideHeader, true, minWidth);
        expect(widgetOf(next, 'dashboard').children.every(it => it.hideHeader)).toBe(true);
        expect(settingValue(next, 'dashboard', hideHeader)).toBe(true);
    });

    it("rescales a dashboard's cells when its columns change", () => {
        const example = builtinExample('dashboard', registry, catalog),
            next = withSetting(
                example,
                'dashboard',
                settingOf('dashboard', 'columns'),
                24,
                minWidth
            ),
            dash = widgetOf(next, 'dashboard');
        expect(dash.config.columns).toBe(24);
        expect(Math.max(...dash.children.map(it => it.x + it.w))).toBe(24);
    });
});

describe('minColumns', () => {
    it("is the widest cell's minimum width", () => {
        expect(minColumns([3, 2, 4])).toBe(4);
        expect(minColumns([])).toBe(1);
    });
});
