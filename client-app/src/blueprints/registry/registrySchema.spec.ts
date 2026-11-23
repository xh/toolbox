import {describe, expect, it} from 'vitest';
import {createPortfolioRegistry} from '../toolboxRegistry';
import {schemaSections} from './registrySchema';

const registry = createPortfolioRegistry(),
    sectionsOf = (name: string) => {
        const spec = registry.widgets[name];
        return schemaSections(spec.config, spec.sections, spec.presetPaths);
    },
    propOf = (name: string, key: string) =>
        sectionsOf(name)
            .flatMap(it => it.props)
            .find(it => it.key === key);

describe('schemaSections', () => {
    it("groups a widget's properties under its Inspector sections, in their order", () => {
        expect(sectionsOf('cubeGrid').map(it => it.title)).toEqual([
            'Data',
            'Display',
            'Columns',
            'Interaction',
            'Style'
        ]);
        expect(
            sectionsOf('dashCanvas')
                .find(it => it.title === 'Display')
                .props.map(it => it.key)
                .slice(0, 2)
        ).toEqual(['columns', 'rowHeight']);
    });

    it('puts properties no section names under Other', () => {
        const sections = schemaSections(
            {type: 'object', properties: {a: {type: 'string'}, b: {type: 'number'}}},
            [{label: 'Main', keys: ['a']}]
        );
        expect(sections.map(it => [it.title, it.props.map(p => p.key)])).toEqual([
            ['Main', ['a']],
            ['Other', ['b']]
        ]);
    });

    it('gives one Properties group to a schema with no sections', () => {
        const sections = schemaSections({type: 'object', properties: {a: {type: 'string'}}});
        expect(sections.map(it => it.title)).toEqual(['Properties']);
    });

    it('lists enum values, the default and annotations as tags', () => {
        const summary = propOf('cubeGrid', 'showSummary');
        expect(summary.enumValues).toEqual(['top', 'bottom', 'true', 'false']);
        expect(summary.default).toBe('false');
        expect(summary.tags.map(it => it.text)).toContain('pictures');
    });

    it('labels a property by its title, else its key in words', () => {
        expect(propOf('cubeGrid', 'showSummary').label).toBe('Summary row');
        expect(propOf('dashCanvas', 'rowHeight').label).toBe('Row height');
    });

    it("nests an array of objects' item properties as children", () => {
        const columnState = propOf('cubeGrid', 'columnState');
        expect(columnState.childrenOf).toBe('each item');
        expect(columnState.children.length).toBeGreaterThan(0);
    });

    it('marks a property presets can set', () => {
        const spec = registry.widgets.cubeGrid,
            preset = spec.presetPaths?.[0]?.slice(1);
        if (!preset) return;
        expect(propOf('cubeGrid', preset).tags.map(it => it.text)).toContain('preset');
    });
});
