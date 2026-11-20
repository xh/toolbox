import {DataCatalog, FakeBlueprintDataProvider, isGlobal} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {find} from 'lodash';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {BlueprintsPanelModel} from './BlueprintsPanelModel';
import {
    BLUEPRINT_TYPE,
    JsonBlobBlueprintRepository,
    PUBLISH_TYPE
} from './repository/JsonBlobBlueprintRepository';
import p1 from './scenarios/p1-one-grid.json';
import p2 from './scenarios/p2-linked-dashboard.json';
import p3 from './scenarios/p3-morning-report.json';
import p5 from './scenarios/p5-risk-report.json';
import w1 from './scenarios/w1-one-city.json';
import w2 from './scenarios/w2-two-cities.json';

const OWNER = 'jdoe',
    OTHER = 'asmith',
    MINE = 'P1 mine',
    MINE_TOO = 'P2 mine';

// The presets the Toolbox server seeds at startup: global blueprints owned by `toolbox`.
const PRESETS = [
    ['p1', 'P1. One grid', p1],
    ['p2', 'P2. A linked dashboard', p2],
    ['p3', 'P3. A morning report', p3],
    ['p5', 'P5. A risk and stress report', p5],
    ['w1', 'W1. Weather for one city', w1],
    ['w2', 'W2. Two cities side by side', w2]
] as const;

let user = OWNER,
    model: BlueprintsPanelModel,
    catalogRequests: number;

beforeAll(async () => {
    await initTestAppAsync();
    seedPresets();
    model = await createModelAsync();
    catalogRequests = hoistCore.requestsTo('blueprints/catalog').length;
});

afterAll(() => model.destroy());

describe('Blueprints designer', () => {
    it('builds its model from the server catalog', () => {
        expect(catalogRequests).toBe(1);
        expect(model.blueprintModel.catalog).toBeInstanceOf(DataCatalog);
    });

    it("lists the server's presets read-only, and opens the first at its publish", () => {
        expect(model.summaries.map(it => it.name)).toEqual(PRESETS.map(it => it[1]));
        expect(model.summaries.every(it => it.access === 'read')).toBe(true);
        expect(model.selected.name).toBe(PRESETS[0][1]);
        expect(model.documentModel.document).toMatchObject({kind: 'publish', version: 1});
        expect(model.blueprintModel.mode).toBe('run');
        expect(model.blueprintModel.blueprint).toMatchObject({root: p1.root});
    });

    it.each(PRESETS.map(it => [it[1]]))('opens %s with no errors', async name => {
        await model.selectAsync(byName(name).id);
        expect(model.selected.name).toBe(name);
        expect(model.issues.filter(it => it.severity === 'error')).toEqual([]);
    });

    it('copies a preset into a private draft of its own, and opens it to design', async () => {
        await model.selectAsync(byName(PRESETS[1][1]).id);
        await model.copyBlueprintAsync(MINE_TOO);
        await model.selectAsync(byName(PRESETS[0][1]).id);
        const id = await model.copyBlueprintAsync(MINE);
        expect(model.selected).toMatchObject({
            id,
            name: MINE,
            access: 'write',
            publishedVersion: null,
            copiedFrom: {id: 'bp-preset-p1', version: 1, as: 'publish'}
        });
        expect(isGlobal(model.selected)).toBe(false);
        expect(model.blueprintModel.mode).toBe('design');
    });

    it('saves edits to the draft as its next version', async () => {
        await model.selectAsync(byName(MINE).id);
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
        const first = byName(MINE).id;
        await model.selectAsync(first);
        groupByRegion(['sector']);
        await model.selectAsync(byName(MINE_TOO).id);
        await model.selectAsync(first);
        expect(groupBy(model)).toEqual(['sector']);
    });

    it('runs overlapping saves one after another, so no edit is lost', async () => {
        await model.selectAsync(byName(MINE).id);
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
        const id = byName(MINE).id;
        await model.selectAsync(id);
        await saveElsewhere(id);

        groupByRegion(['region', 'sector']);
        await model.saveAsync();
        expect(model.documentModel.isStale).toBe(true);
        expect(model.documentModel.isDirty).toBe(true);

        const confirm = vi.spyOn(XH, 'confirm').mockResolvedValue(false);
        await model.selectAsync(byName(MINE_TOO).id);
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
        const id = byName(MINE).id;
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
        await model.selectAsync(byName(MINE).id);
        await model.publishAsync('First');
        await model.publishAsync('Grouped by sector');
        expect(model.selected.publishedVersion).toBe(2);
        expect(model.publishes.map(it => it.version)).toEqual([1, 2]);
        expect(model.publishes.at(-1).note).toBe('Grouped by sector');
    });

    it('keeps a conversation per blueprint, across a reload', async () => {
        const first = byName(MINE).id;
        await model.selectAsync(first);
        model.chatModel.loadMessages([
            {role: 'user', content: 'Group by region'},
            {role: 'assistant', content: 'Done.'}
        ]);

        await model.selectAsync(byName(MINE_TOO).id);
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

    it('deletes the blueprint open, with its conversation, and opens the first left', async () => {
        const id = byName('Scratch').id;
        await model.selectAsync(id);
        await model.deleteBlueprintAsync();
        expect(find(model.summaries, {id})).toBeUndefined();
        expect(model.selected.name).toBe(model.summaries[0].name);
    });

    it("opens another user's global blueprint at its latest publish, read-only, in run mode", async () => {
        await model.selectAsync(byName(MINE).id);
        await model.updateAccessAsync({writers: [], readers: ['*']});

        actAs(OTHER);
        const reader = await createModelAsync();
        expect(reader.summaries.every(it => it.access === 'read')).toBe(true);
        expect(byName(MINE_TOO, reader)).toBeUndefined();

        await reader.selectAsync(byName(MINE, reader).id);
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

// Seed the fake server's presets as BlueprintPresetService does.
function seedPresets() {
    const now = Date.now();
    PRESETS.forEach(([key, name, blueprint]) => {
        const id = `bp-preset-${key}`,
            common = {owner: 'toolbox', acl: '*' as const};
        hoistCore.jsonBlobs.add({
            ...common,
            type: BLUEPRINT_TYPE,
            name: id,
            value: {blueprint, pendingRenames: []},
            meta: {name, draftVersion: 2, publishedVersion: 1, updated: now, updatedBy: 'toolbox'}
        });
        hoistCore.jsonBlobs.add({
            ...common,
            type: PUBLISH_TYPE,
            name: `${id}:1`,
            value: {blueprint},
            meta: {blueprintId: id, version: 1, published: now, publishedBy: 'toolbox', renames: []}
        });
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
