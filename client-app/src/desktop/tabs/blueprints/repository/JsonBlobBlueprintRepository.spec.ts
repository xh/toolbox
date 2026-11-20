import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {afterEach, beforeAll, describe, expect, it, vi} from 'vitest';
import p1 from '../scenarios/p1-one-grid.json';
import {
    BLUEPRINT_TYPE,
    JsonBlobBlueprintRepository,
    PUBLISH_TYPE
} from './JsonBlobBlueprintRepository';

const OWNER = 'jdoe',
    OTHER = 'asmith';

let user = OWNER;

const repository = new JsonBlobBlueprintRepository({username: () => user}),
    blueprint = p1 as Blueprint,
    retitled = (title: string) =>
        ({
            ...blueprint,
            elements: {
                ...blueprint.elements,
                posGrid: {
                    ...blueprint.elements.posGrid,
                    config: {...blueprint.elements.posGrid.config, title}
                }
            }
        }) as Blueprint;

beforeAll(() => initTestAppAsync());

afterEach(() => {
    actAs(OWNER);
    hoistCore.jsonBlobs.reset();
});

function actAs(username: string) {
    user = username;
    hoistCore.user.username = username;
}

describe('JsonBlobBlueprintRepository', () => {
    it("creates a blueprint as its owner's draft, at version 1, with no publish", async () => {
        const record = await repository.createAsync({name: 'Positions', blueprint});

        expect(record).toMatchObject({
            name: 'Positions',
            kind: 'draft',
            version: 1,
            draftVersion: 1,
            publishedVersion: null,
            access: 'write',
            canPublish: true,
            pendingRenames: []
        });
        expect(record.blueprint).toEqual(blueprint);
        expect(await repository.listAsync()).toEqual([
            expect.objectContaining({id: record.id, name: 'Positions', access: 'write'})
        ]);
        expect(await repository.openAsync(record.id, {as: 'publish'})).toBeNull();
        expect(await repository.canCreateAsync()).toBe(true);
    });

    it('saves the draft as its next version, with its renames, and refuses a stale base', async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint}),
            renames = [{kind: 'element' as const, from: 'grid', to: 'posGrid'}];

        expect(
            await repository.saveDraftAsync(id, {blueprint: retitled('Saved'), base: 1, renames})
        ).toEqual({version: 2, issues: []});

        const draft = await repository.openAsync(id, {as: 'draft'});
        expect(draft.version).toBe(2);
        expect(draft.pendingRenames).toEqual(renames);
        expect(draft.blueprint.elements.posGrid.config.title).toBe('Saved');

        const stale = await repository.saveDraftAsync(id, {blueprint, base: 1, renames: []});
        expect(stale.version).toBeUndefined();
        expect(stale.issues).toContainEqual(expect.objectContaining({code: 'edit.staleBase'}));
    });

    it('numbers publishes that never change, moves the renames into each, and bumps the draft', async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint}),
            renames = [{kind: 'element' as const, from: 'grid', to: 'posGrid'}];
        await repository.saveDraftAsync(id, {blueprint: retitled('First'), base: 1, renames});

        const first = await repository.publishAsync(id, {base: 2, note: 'Initial'});
        expect(first).toMatchObject({
            publish: {version: 1, note: 'Initial', renames, publishedBy: OWNER},
            draftVersion: 3,
            issues: []
        });
        expect((await repository.openAsync(id, {as: 'draft'})).pendingRenames).toEqual([]);

        await repository.saveDraftAsync(id, {blueprint: retitled('Second'), base: 3, renames: []});
        expect((await repository.publishAsync(id, {base: 4})).publish.version).toBe(2);

        const v1 = await repository.openAsync(id, {as: 'publish', version: 1}),
            latest = await repository.openAsync(id, {as: 'publish'});
        expect(v1).toMatchObject({kind: 'publish', version: 1});
        expect(v1.blueprint.elements.posGrid.config.title).toBe('First');
        expect(latest.blueprint.elements.posGrid.config.title).toBe('Second');
        expect((await repository.listPublishesAsync(id)).map(it => it.version)).toEqual([1, 2]);
        expect((await repository.listAsync())[0]).toMatchObject({
            draftVersion: 5,
            publishedVersion: 2
        });
    });

    it('refuses a publish based on a stale draft version', async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint});
        const result = await repository.publishAsync(id, {base: 0});
        expect(result.publish).toBeUndefined();
        expect(result.issues).toContainEqual(expect.objectContaining({code: 'edit.staleBase'}));
    });

    it('takes the next free number when a publish of that number already exists', async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint});
        hoistCore.jsonBlobs.add({
            type: PUBLISH_TYPE,
            name: `${id}:1`,
            acl: '*',
            meta: {blueprintId: id, version: 1, published: 1, renames: []},
            value: {blueprint}
        });

        expect((await repository.publishAsync(id, {base: 1})).publish.version).toBe(2);
    });

    it("never rolls back the draft's published version, saving from an older listing", async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint}),
            staleList = await XH.jsonBlobService.listAsync({type: BLUEPRINT_TYPE});
        await repository.publishAsync(id, {base: 1});

        // A save that lists the drafts as they were before the publish.
        const list = vi.spyOn(XH.jsonBlobService, 'listAsync').mockResolvedValueOnce(staleList);
        const result = await repository.saveDraftAsync(id, {blueprint, base: 2, renames: []});
        list.mockRestore();

        expect(result).toEqual({version: 3, issues: []});
        expect((await repository.listAsync())[0]).toMatchObject({
            draftVersion: 3,
            publishedVersion: 1
        });
    });

    it('retries a publish only when another took its number, and rethrows other errors', async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint}),
            create = vi
                .spyOn(XH.jsonBlobService, 'createAsync')
                .mockRejectedValueOnce(new Error('Server unavailable'));

        await expect(repository.publishAsync(id, {base: 1})).rejects.toThrow('Server unavailable');
        expect(create).toHaveBeenCalledTimes(1);
        create.mockRestore();
    });

    it('lets another user read and copy the latest publish, and nothing more', async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint});
        await repository.publishAsync(id, {base: 1});

        actAs(OTHER);
        expect(await repository.listAsync()).toEqual([
            expect.objectContaining({id, access: 'read', canPublish: false})
        ]);
        expect((await repository.listAsync())[0]).toMatchObject({canShare: false});
        expect((await repository.listAsync())[0].sharing).toBeUndefined();
        expect(await repository.openAsync(id, {as: 'publish'})).toMatchObject({
            kind: 'publish',
            version: 1,
            access: 'read'
        });
        expect(await repository.openAsync(id, {as: 'draft'})).toBeNull();
        expect(await repository.openAsync(id, {as: 'publish', version: 1})).toBeNull();

        const save = await repository.saveDraftAsync(id, {blueprint, base: 2, renames: []});
        expect(save.issues).toContainEqual(expect.objectContaining({code: 'edit.notAllowed'}));
        const publish = await repository.publishAsync(id, {base: 2});
        expect(publish.issues).toContainEqual(expect.objectContaining({code: 'edit.notAllowed'}));
        await expect(repository.deleteAsync(id)).rejects.toThrow();

        const copy = await repository.copyAsync(id, {name: 'My positions'});
        expect(copy).toMatchObject({
            name: 'My positions',
            kind: 'draft',
            version: 1,
            access: 'write',
            copiedFrom: {id, version: 1, as: 'publish'}
        });
        expect(copy.blueprint).toEqual(blueprint);
    });

    it("lists another user's blueprint only once it is published", async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint});
        actAs(OTHER);
        expect(await repository.listAsync()).toEqual([]);

        actAs(OWNER);
        await repository.publishAsync(id, {base: 1});
        actAs(OTHER);
        expect((await repository.listAsync()).map(it => it.id)).toEqual([id]);
    });

    it("shows the blueprint's sharing to its owner only", async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint});
        expect((await repository.listAsync())[0]).toMatchObject({
            id,
            canShare: true,
            sharing: {writers: [OWNER], readers: ['*']}
        });
    });

    it("deletes a blueprint with its publishes and the owner's personalizations", async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint});
        await repository.publishAsync(id, {base: 1});
        await repository.savePersonalizationAsync({
            blueprintId: id,
            preset: null,
            ops: [],
            publishVersion: 1
        });

        await repository.deleteAsync(id);

        expect(await repository.listAsync()).toEqual([]);
        expect(await repository.openAsync(id, {as: 'publish'})).toBeNull();
        expect(await repository.loadPersonalizationsAsync(id)).toEqual([]);
        for (const type of [BLUEPRINT_TYPE, PUBLISH_TYPE]) {
            expect(await XH.jsonBlobService.listAsync({type})).toEqual([]);
        }
    });

    it('keeps one personalization per blueprint and preset, for the signed-in user only', async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint}),
            base = {blueprintId: id, ops: [], publishVersion: 1};
        await repository.savePersonalizationAsync({...base, preset: null});
        await repository.savePersonalizationAsync({...base, preset: 'view:risk'});
        await repository.savePersonalizationAsync({
            ...base,
            preset: 'view:risk',
            publishVersion: 2
        });

        const saved = await repository.loadPersonalizationsAsync(id);
        expect(saved.map(it => [it.preset, it.publishVersion])).toEqual([
            [null, 1],
            ['view:risk', 2]
        ]);

        actAs(OTHER);
        expect(await repository.loadPersonalizationsAsync(id)).toEqual([]);
    });

    it("ignores another user's personalizations of a deleted blueprint", async () => {
        const {id} = await repository.createAsync({name: 'Positions', blueprint});
        await repository.publishAsync(id, {base: 1});
        actAs(OTHER);
        await repository.savePersonalizationAsync({
            blueprintId: id,
            preset: null,
            ops: [],
            publishVersion: 1
        });
        actAs(OWNER);
        await repository.deleteAsync(id);

        actAs(OTHER);
        expect(await repository.loadPersonalizationsAsync(id)).toEqual([]);
    });
});
