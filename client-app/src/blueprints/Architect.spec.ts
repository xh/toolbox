import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import type {ChatToolSpec} from '@xh/hoist-chat-kit/core';
import {architectPrompt, BlueprintModel, DataCatalog} from '@xh/hoist-chat-kit/blueprint';
import {FakeBlueprintDataProvider} from '@xh/hoist-chat-kit/blueprint/demo';
import {architectChatTools} from '@xh/hoist-chat-kit/genui/architect';
import {initTestAppAsync} from '@xh/hoist/test-support';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import catalogJson from '../test-support/blueprintsCatalog.json';
import p1 from './scenarios/p1-one-grid.json';
import {createToolboxRegistry} from './toolboxRegistry';

let model: BlueprintModel, tools: Record<string, ChatToolSpec>;

const run = (name: string, input: unknown) => tools[name].execute(input as any, null);

beforeAll(async () => {
    await initTestAppAsync();
    const catalog = new DataCatalog(catalogJson as any);
    model = new BlueprintModel({
        catalog,
        registry: createToolboxRegistry(),
        dataProvider: new FakeBlueprintDataProvider({catalog}),
        mode: 'design',
        access: 'write'
    });
    model.setBlueprint(p1 as Blueprint);
    tools = Object.fromEntries(architectChatTools(model).map(it => [it.name, it]));
});

afterAll(() => model.destroy());

describe("the Architect over Toolbox's registry and catalog", () => {
    it("names Toolbox's own pieces in its prompt and tools", async () => {
        const prompt = architectPrompt(model);
        for (const name of [
            'toolbox.portfolioBuilder',
            'positions',
            'hypotheticalPortfolio',
            'weather'
        ]) {
            expect(prompt).toContain(name);
        }
        const types = JSON.stringify(await run('describe_registry', {kind: 'variableType'}));
        expect(types).toContain('toolbox.fund');
        expect(types).toContain('toolbox.portfolio');
        const renderers = JSON.stringify(await run('describe_registry', {kind: 'renderer'}));
        expect(renderers).toContain('toolbox.ticker');
        expect(renderers).toContain('toolbox.weatherIcon');
    });

    it('edits the blueprint as the architect, and the edit lands in history', async () => {
        const {version} = model;
        await run('edit_blueprint', {
            base: version,
            description: 'Group by region',
            ops: [{op: 'set', path: '/elements/posGrid/config/groupBy', value: ['region']}]
        });
        expect(model.version).toBe(version + 1);
        expect(model.blueprint.elements.posGrid.config.groupBy).toEqual(['region']);
        expect(model.history.at(-1)).toMatchObject({author: 'architect'});
    });

    it('refuses an edit that breaks the blueprint, and says why', async () => {
        const {version} = model;
        await expect(async () =>
            run('edit_blueprint', {
                base: version,
                ops: [{op: 'set', path: '/elements/posGrid/config/groupBy', value: ['nope']}]
            })
        ).rejects.toThrow(/field\.unknown/);
        expect(model.version).toBe(version);
    });
});
