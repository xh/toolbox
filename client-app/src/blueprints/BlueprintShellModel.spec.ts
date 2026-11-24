import {DataCatalog, isGlobal} from '@xh/hoist-chat-kit/blueprint';
import {FakeBlueprintDataProvider} from '@xh/hoist-chat-kit/blueprint/demo';
import {XH} from '@xh/hoist/core';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {find, get} from 'lodash';
import {wait} from '@xh/hoist/promise';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {BlueprintShellModel} from './BlueprintShellModel';
import {PORTFOLIO_TYPE, WEATHER_TYPE} from './blueprintTypes';
import {libraryGroup} from './libraryColumns';
import {JsonBlobBlueprintRepository, jsonBlobTypes} from './repository/JsonBlobBlueprintRepository';
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
    ['p1', 'P1. One grid', p1, PORTFOLIO_TYPE],
    ['p2', 'P2. A linked dashboard', p2, PORTFOLIO_TYPE],
    ['p3', 'P3. A morning report', p3, PORTFOLIO_TYPE],
    ['p5', 'P5. A risk and stress report', p5, PORTFOLIO_TYPE],
    ['w1', 'W1. Weather for one city', w1, WEATHER_TYPE],
    ['w2', 'W2. Two cities side by side', w2, WEATHER_TYPE]
] as const;
const PORTFOLIO_PRESETS = PRESETS.filter(it => it[3] === PORTFOLIO_TYPE);

let user = OWNER,
    model: BlueprintShellModel,
    weatherModel: BlueprintShellModel,
    catalogRequests: number;

beforeAll(async () => {
    await initTestAppAsync();
    seedPresets();
    model = await createModelAsync();
    catalogRequests = hoistCore.requestsTo('blueprints/catalog').length;
    weatherModel = await createModelAsync(WEATHER_TYPE);
});

afterAll(() => {
    model.destroy();
    weatherModel.destroy();
});

describe('Blueprints designer', () => {
    it('builds its model from the server catalog', () => {
        expect(catalogRequests).toBe(1);
        expect(model.blueprintModel.catalog).toBeInstanceOf(DataCatalog);
    });

    it("opens on its library of the type's presets, read-only, as examples", () => {
        expect(model.summaries.map(it => it.name)).toEqual(PORTFOLIO_PRESETS.map(it => it[1]));
        expect(weatherModel.summaries.map(it => it.name)).toEqual([
            'W1. Weather for one city',
            'W2. Two cities side by side'
        ]);
        expect(model.summaries.every(it => it.access === 'read')).toBe(true);
        expect(model.libraryOpen).toBe(true);
        expect(model.documentModel.document).toBeNull();
        expect(groupOf(byName(PRESETS[0][1]).id)).toBe('Examples');
        // With none of the user's own, Yours still shows, with a hint.
        const hint = model.listGridModel.store.allRecords.find(it => it.data.placeholder);
        expect(hint?.data).toMatchObject({group: 'Yours'});
    });

    it('opens a preset at its publish in run mode, and leaves the library', async () => {
        await model.selectAsync(byName(PRESETS[0][1]).id);
        expect(model.libraryOpen).toBe(false);
        expect(model.documentModel.document).toMatchObject({kind: 'publish', version: 1});
        expect(model.blueprintModel.mode).toBe('run');
        expect(model.blueprintModel.blueprint).toMatchObject({root: p1.root});
    });

    it.each(PRESETS.map(it => [it[1], it[3]]))('opens %s with no errors', async (name, type) => {
        const m = type === WEATHER_TYPE ? weatherModel : model;
        await m.selectAsync(byName(name, m).id);
        expect(m.selected.name).toBe(name);
        expect(m.issues.filter(it => it.severity === 'error')).toEqual([]);
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

    it('previews a draft in run mode, and returns to the view it came from', async () => {
        await model.selectAsync(byName(MINE).id);
        model.editorView = 'map';
        expect(model.blueprintModel.mode).toBe('design');

        model.togglePreview();
        expect(model.editorView).toBe('preview');
        expect(model.blueprintModel.mode).toBe('run');

        model.togglePreview();
        expect(model.editorView).toBe('map');
        expect(model.blueprintModel.mode).toBe('design');
        model.editorView = 'canvas';
    });

    it('leaves Preview for the view last shown when design mode is set from elsewhere', async () => {
        await model.selectAsync(byName(MINE).id);
        model.togglePreview();
        model.blueprintModel.setMode('design');
        expect(model.editorView).toBe('canvas');

        model.editorView = 'map';
        model.togglePreview();
        expect(model.editorView).toBe('preview');
        model.blueprintModel.setMode('design');
        expect(model.editorView).toBe('map');
        model.editorView = 'canvas';
    });

    it('shows Preview when run mode is set from elsewhere on a draft', async () => {
        await model.selectAsync(byName(MINE).id);
        model.blueprintModel.setMode('run');
        expect(model.editorView).toBe('preview');
        model.togglePreview();
        expect(model.editorView).toBe('canvas');
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

    it('keeps a publish open, and the draft after it, out of Preview', async () => {
        await model.selectAsync(byName(MINE_TOO).id);
        await model.publishAsync('First');
        model.editorView = 'map';

        await model.openVersionAsync(1);
        expect(model.documentModel.document.kind).toBe('publish');
        expect(model.editorView).toBe('map');

        await model.openVersionAsync('draft');
        expect(model.editorView).toBe('map');
        expect(model.blueprintModel.mode).toBe('design');
        model.editorView = 'canvas';
    });

    it('copies, renames and deletes from the library without opening the blueprint', async () => {
        await model.showLibraryAsync();
        const openId = model.documentModel.document?.id,
            prompt = vi.spyOn(XH, 'prompt').mockResolvedValue('Library copy'),
            confirm = vi.spyOn(XH, 'confirm').mockResolvedValue(true);
        try {
            await model.copyFromLibraryAsync(byName(PRESETS[0][1]).id);
            const copy = byName('Library copy');
            expect(copy).toMatchObject({access: 'write'});

            prompt.mockResolvedValue('Library copy renamed');
            await model.renameFromLibraryAsync(copy.id);
            expect(byName('Library copy renamed')?.id).toBe(copy.id);

            await model.deleteFromLibraryAsync(copy.id);
            expect(byName('Library copy renamed')).toBeUndefined();
            expect(model.libraryOpen).toBe(true);
            expect(model.documentModel.document?.id).toBe(openId);
        } finally {
            prompt.mockRestore();
            confirm.mockRestore();
        }
    });

    it("loads each blueprint once for the library's cards, at its current version", async () => {
        const opens = () => hoistCore.requestsTo('xh/getJsonBlob').length;
        model.libraryView = 'cards';
        try {
            const ids = model.summaries.map(it => it.id);
            await vi.waitFor(() =>
                expect(Object.keys(model.previews).sort()).toEqual([...ids].sort())
            );
            expect(model.previews[byName(PRESETS[0][1]).id].blueprint).toMatchObject({
                root: p1.root
            });

            const before = opens();
            model.libraryView = 'list';
            model.libraryView = 'cards';
            // Lets any load the switch started reach the server, for the check that none did.
            await wait(0);
            expect(opens()).toBe(before);
        } finally {
            model.libraryView = 'list';
        }
    });

    it('renames the blueprint open, and refuses a name the user already has', async () => {
        const id = byName(MINE_TOO).id;
        await model.selectAsync(id);
        await model.renameAsync(`${MINE_TOO} renamed`);
        expect(model.selected.name).toBe(`${MINE_TOO} renamed`);
        expect(model.documentModel.document.name).toBe(`${MINE_TOO} renamed`);
        expect(model.listGridModel.store.allRecords.some(it => it.data.placeholder)).toBe(false);

        await expect(model.renameAsync(MINE)).rejects.toMatchObject({httpStatus: 400});
        expect(model.selected.name).toBe(`${MINE_TOO} renamed`);
        await model.renameAsync(MINE_TOO);
    });

    it('keeps the blueprints opened lately, latest first, across a reload', async () => {
        const mine = byName(MINE).id,
            mineToo = byName(MINE_TOO).id;
        await model.selectAsync(mine);
        await model.selectAsync(mineToo);
        await model.selectAsync(mine);
        expect(model.recentIds.slice(0, 2)).toEqual([mine, mineToo]);
        expect(model.recentIds.filter(it => it === mine)).toHaveLength(1);

        // Persistence writes are debounced, so wait for this one to land.
        await vi.waitFor(() => {
            const stored = XH.localStorageService.get(`spec.${PORTFOLIO_TYPE.name}`);
            expect(get(stored, `recentIds.${PORTFOLIO_TYPE.name}`)?.slice(0, 2)).toEqual([
                mine,
                mineToo
            ]);
        });

        const reloaded = await createModelAsync();
        expect(reloaded.recentIds.slice(0, 2)).toEqual([mine, mineToo]);
        reloaded.destroy();
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

    it('opens a link: the draft, a numbered publish, and a variable it sets', async () => {
        const {id} = byName(MINE);
        await model.openLinkAsync({id, draft: ''});
        expect(model.selectedId).toBe(id);
        expect(model.documentModel.document).toMatchObject({kind: 'draft'});

        await model.openLinkAsync({id, version: '1', asOf: '2026-11-02'});
        expect(model.documentModel.document).toMatchObject({kind: 'publish', version: 1});
        expect(String(model.blueprintModel.getVariable('asOf').value)).toBe('2026-11-02');
    });

    it('refuses a link to a blueprint that is missing, for the denied view', async () => {
        await model.openLinkAsync({id: 'bp-nope'});
        expect(model.openIssues.some(it => it.severity === 'error')).toBe(true);
        await model.selectAsync(byName(MINE).id);
    });

    it('creates an empty dashboard, and opens its draft', async () => {
        const id = await model.createBlueprintAsync('Scratch');
        expect(model.selectedId).toBe(id);
        expect(model.selected).toMatchObject({name: 'Scratch', publishedVersion: null});
        expect(model.issues.filter(it => it.severity === 'error')).toEqual([]);
        expect(model.blueprintModel.blueprint.elements).toBeTruthy();
    });

    it('deletes the blueprint open, with its conversation, and returns to the library', async () => {
        const id = byName('Scratch').id;
        await model.selectAsync(id);
        expect(libraryGroup(find(model.summaries, {id}))).toBe('Yours');
        await model.deleteBlueprintAsync();
        expect(find(model.summaries, {id})).toBeUndefined();
        expect(model.libraryOpen).toBe(true);
        expect(model.selectedId).toBeNull();
    });

    it('returns to the library, saving the draft first', async () => {
        await model.selectAsync(byName(MINE).id);
        groupByRegion(['sector']);
        await model.showLibraryAsync();
        expect(model.libraryOpen).toBe(true);
        expect(model.documentModel.isDirty).toBe(false);
        await model.selectAsync(byName(MINE).id);
        expect(model.libraryOpen).toBe(false);
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
async function createModelAsync(type = PORTFOLIO_TYPE): Promise<BlueprintShellModel> {
    const ret = new BlueprintShellModel({
        type,
        storageKey: `spec.${type.name}`,
        createProvider: catalog => new FakeBlueprintDataProvider({catalog}),
        repository: new JsonBlobBlueprintRepository({type: type.name, username: () => user})
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
    PRESETS.forEach(([key, name, blueprint, type]) => {
        const id = `bp-preset-${key}`,
            common = {owner: 'toolbox', acl: '*' as const},
            types = jsonBlobTypes(type.name);
        hoistCore.jsonBlobs.add({
            ...common,
            type: types.draft,
            name: id,
            value: {blueprint, pendingRenames: []},
            meta: {name, draftVersion: 2, publishedVersion: 1, updated: now, updatedBy: 'toolbox'}
        });
        hoistCore.jsonBlobs.add({
            ...common,
            type: types.publish,
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

function groupOf(id: string) {
    return model.listGridModel.store.getById(id)?.data.group;
}

function byName(name: string, m: BlueprintShellModel = model) {
    return find(m.summaries, {name});
}

function groupByRegion(value: string[] = ['region']) {
    const {blueprintModel} = model;
    blueprintModel.applyEdit({
        base: blueprintModel.version,
        ops: [{op: 'set', path: '/elements/posGrid/config/groupBy', value}]
    });
}

const groupBy = (m: BlueprintShellModel) =>
    m.blueprintModel.blueprint.elements.posGrid.config.groupBy;

const texts = (m: BlueprintShellModel) => m.chatModel.messages.map(it => it.text);
