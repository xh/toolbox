import {DataCatalog, FakeBlueprintDataProvider} from '@xh/hoist-chat-kit/blueprint';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {XH} from '@xh/hoist/core';
import {cloneDeep, find, omit} from 'lodash';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {BlueprintsPanelModel, PRESETS} from './BlueprintsPanelModel';
import p1 from './scenarios/p1-one-grid.json';
import p2 from './scenarios/p2-linked-dashboard.json';

let model: BlueprintsPanelModel, catalogRequests: number;

beforeAll(async () => {
    await initTestAppAsync();
    model = await createModelAsync();
    catalogRequests = hoistCore.requestsTo('blueprints/catalog').length;
});

afterAll(() => model.destroy());

describe('Blueprints designer', () => {
    it('builds its model from the server catalog, in design mode', () => {
        expect(catalogRequests).toBe(1);
        expect(model.blueprintModel.catalog).toBeInstanceOf(DataCatalog);
        expect(model.blueprintModel.mode).toBe('design');
    });

    it('seeds the library with the presets, and opens the first', () => {
        expect(model.records.map(it => it.id)).toEqual(PRESETS.map(it => it.id));
        expect(model.selectedId).toBe('p1');
        expect(model.blueprintModel.blueprint).toEqual(p1);
    });

    it.each(PRESETS.map(it => [it.name, it.id]))('opens %s with no errors', (_, id) => {
        model.selectedId = id;
        expect(model.blueprintModel.blueprint).toEqual(find(PRESETS, {id}).blueprint);
        expect(model.issues.filter(it => it.severity === 'error')).toEqual([]);
    });

    it('returns to the blueprint view when one is opened', () => {
        model.view = 'catalog';
        model.selectedId = 'p2';
        expect(model.view).toBe('blueprint');
    });

    it('keeps edits to each blueprint, across a reload', async () => {
        model.selectedId = 'p1';
        groupByRegion();
        model.selectedId = 'p2';
        expect(model.blueprintModel.blueprint).toEqual(p2);

        model.selectedId = 'p1';
        expect(groupBy(model)).toEqual(['region']);

        const reloaded = await createModelAsync();
        expect(reloaded.selectedId).toBe('p1');
        expect(groupBy(reloaded)).toEqual(['region']);
        reloaded.destroy();
    });

    it('keeps a conversation per blueprint, across a reload', async () => {
        model.selectedId = 'p1';
        model.chatModel.loadMessages([
            {role: 'user', content: 'Group by region'},
            {role: 'assistant', content: 'Done.'}
        ]);

        model.selectedId = 'p2';
        expect(model.chatModel.isEmpty).toBe(true);

        model.selectedId = 'p1';
        expect(texts(model)).toEqual(['Group by region', 'Done.']);

        const reloaded = await createModelAsync();
        expect(texts(reloaded)).toEqual(['Group by region', 'Done.']);
        reloaded.destroy();
    });

    it('clears the conversation of the open blueprint only', () => {
        model.selectedId = 'p2';
        model.chatModel.loadMessages([{role: 'user', content: 'Hello'}]);
        model.selectedId = 'p1';
        model.clearConversation();
        expect(model.chatModel.isEmpty).toBe(true);

        model.selectedId = 'p2';
        expect(texts(model)).toEqual(['Hello']);
    });

    it('adds an empty blueprint, with an empty conversation, and opens it', () => {
        const {id} = model.addBlueprint('Scratch');
        expect(model.selectedId).toBe(id);
        expect(find(model.records, {id}).name).toBe('Scratch');
        expect(model.blueprintModel.blueprint).toBeNull();
        expect(model.chatModel.isEmpty).toBe(true);
    });

    it('adds a blueprint from a given one', () => {
        model.addBlueprint('Copy of P2', p2);
        expect(model.blueprintModel.blueprint).toEqual(p2);
    });

    it('deletes a blueprint, and opens the first left', () => {
        model.selectedId = 'p2';
        model.deleteBlueprint('p2');
        expect(find(model.records, {id: 'p2'})).toBeUndefined();
        expect(model.selectedId).toBe('p1');
    });

    it('brings a stored blueprint in an older shape up to date as the library loads', async () => {
        const stale = cloneDeep(PRESETS),
            p5 = find(stale, {id: 'p5'}).blueprint;
        p5.elements.optionsGrid.config = {
            ...omit(p5.elements.optionsGrid.config, 'columns'),
            columnState: [{field: 'delta', format: {name: 'greek', scale: 'thousands'}}]
        };
        XH.localStorageService.set('blueprints.designer.library', stale);

        const reloaded = await createModelAsync();
        reloaded.selectedId = 'p5';
        expect(reloaded.issues.filter(it => it.severity === 'error')).toEqual([]);
        expect(reloaded.blueprintModel.blueprint.elements.optionsGrid.config.columns).toEqual({
            delta: {format: {name: 'greek', scale: 'thousands'}}
        });
        reloaded.destroy();
    });

    it('restores the presets, and their empty conversations, on a reset', () => {
        model.resetLibrary();
        expect(model.records.map(it => it.id)).toEqual(PRESETS.map(it => it.id));
        expect(model.selectedId).toBe('p1');
        expect(model.blueprintModel.blueprint).toEqual(p1);
        expect(model.chatModel.isEmpty).toBe(true);
    });
});

//------------------
// Helpers
//------------------
async function createModelAsync(): Promise<BlueprintsPanelModel> {
    const ret = new BlueprintsPanelModel(catalog => new FakeBlueprintDataProvider({catalog}));
    await ret.loadAsync();
    return ret;
}

function groupByRegion() {
    const {blueprintModel} = model;
    blueprintModel.applyEdit({
        base: blueprintModel.version,
        ops: [{op: 'set', path: '/elements/posGrid/config/groupBy', value: ['region']}]
    });
}

const groupBy = (m: BlueprintsPanelModel) =>
    m.blueprintModel.blueprint.elements.posGrid.config.groupBy;

const texts = (m: BlueprintsPanelModel) => m.chatModel.messages.map(it => it.text);
