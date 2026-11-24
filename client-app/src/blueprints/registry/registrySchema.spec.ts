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
    it("groups properties by x-group, in the six sections' order, with advanced ones under More", () => {
        const sections = schemaSections({
            type: 'object',
            properties: {
                b: {type: 'string', 'x-group': 'appearance'},
                a: {type: 'string', 'x-group': 'data'},
                c: {type: 'string', 'x-group': 'appearance', 'x-advanced': true},
                d: {type: 'string'}
            }
        });
        expect(
            sections.map(it => [it.title, it.props.map(p => p.key), it.more.map(p => p.key)])
        ).toEqual([
            ['Data', ['a'], []],
            ['Appearance', ['b'], ['c']],
            ['Other', ['d'], []]
        ]);
    });

    it("groups a built-in widget's properties by its x-group annotations", () => {
        const titles = sectionsOf('cubeGrid').map(it => it.title),
            order = ['Data', 'List', 'Content', 'Appearance', 'Behavior', 'Layout'];
        expect(titles.every(it => order.includes(it))).toBe(true);
        expect(titles).toEqual([...titles].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
        expect(sectionsOf('cubeGrid').some(it => it.more.length)).toBe(true);
    });

    it('does not tag a property with its x-group or x-advanced', () => {
        const tags = sectionsOf('cubeGrid')
            .flatMap(it => [...it.props, ...it.more])
            .flatMap(it => it.tags.map(tag => tag.text));
        expect(tags.some(it => it.startsWith('group') || it === 'advanced')).toBe(false);
    });

    it("groups a list item's properties by the item's x-groups", () => {
        const [section] = schemaSections({
                type: 'object',
                properties: {
                    columns: {
                        type: 'object',
                        'x-group': 'list',
                        additionalProperties: {
                            type: 'object',
                            'x-groups': [
                                {id: 'header', label: 'Header'},
                                {id: 'size', label: 'Size and position'}
                            ],
                            properties: {
                                width: {type: 'number', 'x-group': 'size'},
                                headerName: {type: 'string', 'x-group': 'header'},
                                extra: {type: 'string'}
                            }
                        }
                    }
                }
            }),
            [columns] = section.props;
        expect(columns.childGroups.map(it => [it.title, it.props.map(p => p.key)])).toEqual([
            ['Header', ['headerName']],
            ['Size and position', ['width']],
            ['Other', ['extra']]
        ]);
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
        expect(propOf('dashboard', 'rowHeight').label).toBe('Row height');
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
