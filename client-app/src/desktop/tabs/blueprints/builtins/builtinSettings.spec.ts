import {describe, expect, it} from 'vitest';
import {createPortfolioRegistry} from '../../../../blueprints/toolboxRegistry';
import {builtinSettings} from './builtinSettings';

const registry = createPortfolioRegistry(),
    settingsOf = (name: string) => builtinSettings({...registry.widgets[name], name});

describe('builtinSettings', () => {
    it("takes a widget's simple settings from its sections, in order", () => {
        expect(settingsOf('dashCanvas').map(it => [it.key, it.kind])).toEqual([
            ['columns', 'number'],
            ['rowHeight', 'number'],
            ['hideHeader', 'bool']
        ]);
    });

    it('marks settings that apply to each child', () => {
        const hideHeader = settingsOf('dashCanvas').find(it => it.key === 'hideHeader');
        expect(hideHeader.perChild).toBe(true);
    });

    it('offers choices without the bare true, with their thumbnails', () => {
        const summary = settingsOf('cubeGrid').find(it => it.key === 'showSummary');
        expect(summary.kind).toBe('choice');
        expect(summary.options).toEqual(['top', 'bottom', false]);
        expect(summary.thumbnails).toBeTruthy();
    });

    it('leaves out field names and bindings to data, and keeps collapsed sections', () => {
        const keys = settingsOf('cubeGrid').map(it => it.key);
        expect(keys).not.toContain('source');
        expect(keys).not.toContain('groupBy');
        expect(keys).toContain('stripeRows');
    });

    it('shows a setting named for its negative positive first', () => {
        const hideHeader = settingsOf('dashCanvas').find(it => it.key === 'hideHeader');
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
        const byKey = Object.fromEntries(settingsOf('dashCanvas').map(it => [it.key, it.label]));
        expect(byKey.rowHeight).toBe('Row height');
    });
});
