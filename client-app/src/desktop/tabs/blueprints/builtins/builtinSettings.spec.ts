import {describe, expect, it} from 'vitest';
import {createPortfolioRegistry} from '../../../../blueprints/toolboxRegistry';
import {builtinSettings, minColumns} from './builtinSettings';

const registry = createPortfolioRegistry(),
    settingsOf = (name: string) => builtinSettings({...registry.widgets[name], name});

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

describe('minColumns', () => {
    it("is the widest cell's minimum width", () => {
        expect(minColumns([3, 2, 4])).toBe(4);
        expect(minColumns([])).toBe(1);
    });
});
