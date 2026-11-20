import {DataCatalog, FakeBlueprintDataProvider, isGlobal} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {find} from 'lodash';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {BlueprintsPanelModel, PRESETS} from './BlueprintsPanelModel';
import {JsonBlobBlueprintRepository} from './repository/JsonBlobBlueprintRepository';
import p1 from './scenarios/p1-one-grid.json';

const OWNER = 'jdoe',
    OTHER = 'asmith';

let user = OWNER,
    model: BlueprintsPanelModel,
    catalogRequests: number;

beforeAll(async () => {
    await initTestAppAsync();
    model = await createModelAsync();
    catalogRequests = hoistCore.requestsTo('blueprints/catalog').length;
});

afterAll(() => model.destroy());

describe('Blueprints designer', () => {
    it('builds its model from the server catalog', () => {
        expect(catalogRequests).toBe(1);
        expect(model.blueprintModel.catalog).toBeInstanceOf(DataCatalog);
    });

    it('seeds an empty library with the presets, each published, and opens the first draft', () => {
        expect(model.summaries.map(it => it.name)).toEqual(PRESETS.map(it => it.name));
        expect(model.summaries.every(it => it.publishedVersion === 1)).toBe(true);
        expect(model.selected.name).toBe(PRESETS[0].name);
        expect(model.documentModel.document).toMatchObject({kind: 'draft', access: 'write'});
        expect(model.blueprintModel.mode).toBe('design');
        expect(model.blueprintModel.blueprint).toMatchObject({root: p1.root});
    });

    it.each(PRESETS.map(it => [it.name]))('opens %s with no errors', async name => {
        await model.selectAsync(byName(name).id);
        expect(model.selected.name).toBe(name);
        expect(model.issues.filter(it => it.severity === 'error')).toEqual([]);
    });

    it('saves edits to the draft as its next version', async () => {
        await model.selectAsync(byName(PRESETS[0].name).id);
        const {version} = model.documentModel.document;
        groupByRegion();
        expect(model.documentModel.isDirty).toBe(true);

        await model.saveAsync();
        expect(model.documentModel.isDirty).toBe(false);
        expect(model.documentModel.document.version).toBe(version + 1);

        const reloaded = await createModelAsync();
        await reloaded.selectAsync(model.selectedId);
        expect(groupBy(reloaded)).toEqual(['region']);
        reloaded.destroy();
    });

    it('saves unsaved edits before opening another blueprint', async () => {
        const first = byName(PRESETS[0].name).id;
        await model.selectAsync(first);
        groupByRegion(['sector']);
        await model.selectAsync(byName(PRESETS[1].name).id);
        await model.selectAsync(first);
        expect(groupBy(model)).toEqual(['sector']);
    });

    it('runs overlapping saves one after another, so no edit is lost', async () => {
        await model.selectAsync(byName(PRESETS[0].name).id);
        const {version} = model.documentModel.document;
        groupByRegion(['strategy']);
        const first = model.saveAsync();
        groupByRegion(['trader']);
        await Promise.all([first, model.saveAsync()]);

        expect(model.saveIssues).toEqual([]);
        expect(model.documentModel.isDirty).toBe(false);
        expect(model.documentModel.document.version).toBeGreaterThan(version);
        const saved = await model.repository.openAsync(model.selectedId, {as: 'draft'});
        expect(saved.blueprint.elements.posGrid.config.groupBy).toEqual(['trader']);
    });

    it('holds a stale draft unsaved, and asks before leaving its edits', async () => {
        const id = byName(PRESETS[0].name).id;
        await model.selectAsync(id);
        await saveElsewhere(id);

        groupByRegion(['region', 'sector']);
        await model.saveAsync();
        expect(model.documentModel.isStale).toBe(true);
        expect(model.documentModel.isDirty).toBe(true);

        const confirm = vi.spyOn(XH, 'confirm').mockResolvedValue(false);
        await model.selectAsync(byName(PRESETS[1].name).id);
        expect(confirm).toHaveBeenCalled();
        expect(model.selectedId).toBe(id);
        expect(groupBy(model)).toEqual(['region', 'sector']);
        confirm.mockRestore();
    });

    it('reloads a stale draft, discarding its edits', async () => {
        const id = model.selectedId,
            stored = await model.repository.openAsync(id, {as: 'draft'});
        await model.reloadDraftAsync();
        expect(model.documentModel.isStale).toBe(false);
        expect(model.documentModel.isDirty).toBe(false);
        expect(model.documentModel.document.version).toBe(stored.version);
    });

    it("saves a stale draft's edits as a new blueprint, with its conversation", async () => {
        const id = byName(PRESETS[0].name).id;
        await model.selectAsync(id);
        model.chatModel.loadMessages([{role: 'user', content: 'Group by trader'}]);
        await saveElsewhere(id);
        groupByRegion(['fund']);
        await model.saveAsync();
        expect(model.documentModel.isStale).toBe(true);

        const newId = await model.saveAsNewAsync('P1 kept');
        expect(newId).not.toBe(id);
        expect(model.selected).toMatchObject({
            id: newId,
            name: 'P1 kept',
            copiedFrom: {id, as: 'draft'}
        });
        expect(model.documentModel.isStale).toBe(false);
        expect(groupBy(model)).toEqual(['fund']);
        expect(texts(model)).toEqual(['Group by trader']);
    });

    it('publishes the draft as the next version, and lists its publishes', async () => {
        await model.selectAsync(byName(PRESETS[0].name).id);
        await model.publishAsync('Grouped by sector');
        expect(model.selected.publishedVersion).toBe(2);
        expect(model.publishes.map(it => it.version)).toEqual([1, 2]);
        expect(model.publishes.at(-1).note).toBe('Grouped by sector');
    });

    it('keeps a conversation per blueprint, across a reload', async () => {
        const first = byName(PRESETS[0].name).id;
        await model.selectAsync(first);
        model.chatModel.loadMessages([
            {role: 'user', content: 'Group by region'},
            {role: 'assistant', content: 'Done.'}
        ]);

        await model.selectAsync(byName(PRESETS[1].name).id);
        expect(model.chatModel.isEmpty).toBe(true);

        await model.selectAsync(first);
        expect(texts(model)).toEqual(['Group by region', 'Done.']);

        const reloaded = await createModelAsync();
        await reloaded.selectAsync(first);
        expect(texts(reloaded)).toEqual(['Group by region', 'Done.']);
        reloaded.destroy();
    });

    it('shares the blueprint open with everyone, and makes it private again', async () => {
        const id = await model.createBlueprintAsync('Shared');
        expect(model.documentModel.document.sharing).toEqual({writers: [], readers: []});

        await model.updateAccessAsync({writers: [], readers: ['*']});
        expect(isGlobal(model.selected)).toBe(true);
        expect(model.documentModel.document.sharing).toEqual({writers: [], readers: ['*']});

        await model.updateAccessAsync({writers: [], readers: []});
        expect(isGlobal(find(model.summaries, {id}))).toBe(false);
        await model.deleteBlueprintAsync();
    });

    it('creates an empty dashboard, and opens its draft', async () => {
        const id = await model.createBlueprintAsync('Scratch');
        expect(model.selectedId).toBe(id);
        expect(model.selected).toMatchObject({name: 'Scratch', publishedVersion: null});
        expect(model.issues.filter(it => it.severity === 'error')).toEqual([]);
        expect(model.blueprintModel.blueprint.elements).toBeTruthy();
    });

    it('copies the blueprint open into a new one, and opens it', async () => {
        const source = byName(PRESETS[1].name);
        await model.selectAsync(source.id);
        const id = await model.copyBlueprintAsync('P2 copy');
        expect(model.selected).toMatchObject({
            id,
            name: 'P2 copy',
            copiedFrom: {id: source.id, as: 'publish'}
        });
    });

    it('deletes the blueprint open, with its conversation, and opens the first left', async () => {
        const id = byName('Scratch').id;
        await model.selectAsync(id);
        await model.deleteBlueprintAsync();
        expect(find(model.summaries, {id})).toBeUndefined();
        expect(model.selected.name).toBe(model.summaries[0].name);
    });

    it("opens another user's blueprint at its latest publish, read-only, in run mode", async () => {
        actAs(OTHER);
        const reader = await createModelAsync();
        expect(reader.summaries.length).toBeGreaterThan(0);
        expect(reader.summaries.every(it => it.access === 'read')).toBe(true);

        await reader.selectAsync(byName(PRESETS[0].name, reader).id);
        expect(reader.documentModel.document).toMatchObject({
            kind: 'publish',
            version: 2,
            access: 'read'
        });
        expect(reader.blueprintModel.mode).toBe('run');
        expect(reader.canEdit).toBe(false);
        reader.destroy();
        actAs(OWNER);
    });
});

//------------------
// Helpers
//------------------
async function createModelAsync(): Promise<BlueprintsPanelModel> {
    const ret = new BlueprintsPanelModel({
        createProvider: catalog => new FakeBlueprintDataProvider({catalog}),
        repository: new JsonBlobBlueprintRepository({username: () => user})
    });
    await ret.loadAsync();
    return ret;
}

// Save the draft as another tab would, leaving the designer's copy stale.
async function saveElsewhere(id: string) {
    const other = await model.repository.openAsync(id, {as: 'draft'});
    await model.repository.saveDraftAsync(id, {
        blueprint: other.blueprint,
        base: other.version,
        renames: []
    });
}

function actAs(username: string) {
    user = username;
    hoistCore.user.username = username;
}

function byName(name: string, m: BlueprintsPanelModel = model) {
    return find(m.summaries, {name});
}

function groupByRegion(value: string[] = ['region']) {
    const {blueprintModel} = model;
    blueprintModel.applyEdit({
        base: blueprintModel.version,
        ops: [{op: 'set', path: '/elements/posGrid/config/groupBy', value}]
    });
}

const groupBy = (m: BlueprintsPanelModel) =>
    m.blueprintModel.blueprint.elements.posGrid.config.groupBy;

const texts = (m: BlueprintsPanelModel) => m.chatModel.messages.map(it => it.text);
