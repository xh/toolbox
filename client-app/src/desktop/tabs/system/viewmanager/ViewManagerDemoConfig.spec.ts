// Protects the rail-to-config mapping behind the ViewManager demo, and keeps the Playground's
// config snippet in step with the config the live model is built with.
import type {ViewInfo} from '@xh/hoist/cmp/viewmanager';
import {describe, expect, it} from 'vitest';
import type {DemoModelConfig} from './ViewManagerDemoConfig';
import {createConfigSnippet, createModelConfig} from './ViewManagerDemoConfig';

/** The rail's starting values, as ViewManagerPanelModel sets them. */
const RAIL_DEFAULTS: DemoModelConfig = {
    type: 'viewManagerDemo',
    instance: 'default',
    typeDisplayName: 'view',
    defaultDisplayName: 'default',
    globalDisplayName: 'global',
    initialViewName: null,
    enableAutoSave: true,
    enableDefault: true,
    enableGlobal: true,
    enableSharing: true,
    manageGlobal: true,
    preserveUnsavedChanges: true
};

const VIEWS = [{name: 'View A'}, {name: 'View B'}] as ViewInfo[];

describe('createModelConfig', () => {
    it('falls back to framework defaults for blank text options', () => {
        const config = createModelConfig({
            ...RAIL_DEFAULTS,
            type: '  myType  ',
            instance: ' ',
            typeDisplayName: '',
            defaultDisplayName: null,
            globalDisplayName: '  '
        });
        expect(config.type).toBe('myType');
        expect(config.instance).toBeUndefined();
        expect(config.typeDisplayName).toBeUndefined();
        expect(config.defaultDisplayName).toBeUndefined();
        expect(config.globalDisplayName).toBeUndefined();
    });

    it('defers manageGlobal to the server unless switched off', () => {
        expect(createModelConfig(RAIL_DEFAULTS).manageGlobal).toBeUndefined();
        expect(createModelConfig({...RAIL_DEFAULTS, manageGlobal: false}).manageGlobal).toBe(false);
    });

    it('sets no initialViewSpec when the default view is on and no view is named', () => {
        expect(createModelConfig(RAIL_DEFAULTS).initialViewSpec).toBeUndefined();
    });

    it('picks the named view, else the in-code default', () => {
        const spec = createModelConfig({
            ...RAIL_DEFAULTS,
            initialViewName: 'View B'
        }).initialViewSpec;
        expect(spec(VIEWS)).toBe(VIEWS[1]);
        expect(spec([VIEWS[0]])).toBeNull();
    });

    it('falls back to the first view when the default view is off', () => {
        const noName = createModelConfig({...RAIL_DEFAULTS, enableDefault: false}),
            missing = createModelConfig({
                ...RAIL_DEFAULTS,
                enableDefault: false,
                initialViewName: 'Missing'
            });
        expect(noName.initialViewSpec(VIEWS)).toBe(VIEWS[0]);
        expect(missing.initialViewSpec(VIEWS)).toBe(VIEWS[0]);
    });
});

describe('createConfigSnippet', () => {
    it('leaves out options at their framework defaults', () => {
        expect(createConfigSnippet(RAIL_DEFAULTS)).toBe(
            [
                'const viewManagerModel = await ViewManagerModel.createAsync({',
                "    type: 'viewManagerDemo',",
                "    typeDisplayName: 'view'",
                '});'
            ].join('\n')
        );
    });

    it('shows each option that differs from its framework default', () => {
        const snippet = createConfigSnippet({
            ...RAIL_DEFAULTS,
            instance: 'second',
            defaultDisplayName: 'New',
            globalDisplayName: 'Acme',
            enableAutoSave: false,
            enableDefault: false,
            enableGlobal: false,
            enableSharing: false,
            manageGlobal: false,
            preserveUnsavedChanges: false
        });
        expect(snippet).toContain("    instance: 'second',");
        expect(snippet).toContain("    defaultDisplayName: 'New',");
        expect(snippet).toContain("    globalDisplayName: 'Acme',");
        expect(snippet).toContain('    initialViewSpec: views => views[0],');
        expect(snippet).toContain('    enableDefault: false,');
        expect(snippet).toContain('    enableAutoSave: false,');
        expect(snippet).toContain('    enableSharing: false,');
        expect(snippet).toContain('    enableGlobal: false,');
        expect(snippet).toContain('    manageGlobal: false,');
        expect(snippet).toContain('    preserveUnsavedChanges: false\n');
    });

    it('shows the initialViewSpec fallback that the live function uses', () => {
        const withDefault = createConfigSnippet({...RAIL_DEFAULTS, initialViewName: 'View B'}),
            withoutDefault = createConfigSnippet({
                ...RAIL_DEFAULTS,
                initialViewName: 'View B',
                enableDefault: false
            });
        expect(withDefault).toContain(
            "initialViewSpec: views => views.find(it => it.name === 'View B') ?? null"
        );
        expect(withoutDefault).toContain(
            "initialViewSpec: views => views.find(it => it.name === 'View B') ?? views[0]"
        );
    });

    it('escapes quotes and backslashes in a view name', () => {
        const snippet = createConfigSnippet({...RAIL_DEFAULTS, initialViewName: "Bob's \\view"});
        expect(snippet).toContain("it.name === 'Bob\\'s \\\\view'");
    });
});
