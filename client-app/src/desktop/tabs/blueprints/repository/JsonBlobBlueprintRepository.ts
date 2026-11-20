import type {
    Blueprint,
    BlueprintIssue,
    BlueprintOpenOptions,
    BlueprintPersonalization,
    BlueprintPublish,
    BlueprintPublishResult,
    BlueprintRecord,
    BlueprintRename,
    BlueprintRepository,
    BlueprintSaveResult,
    BlueprintSummary
} from '@xh/hoist-chat-kit/blueprint';
import {staleBaseIssue} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import type {JsonBlob} from '@xh/hoist/svc';
import {maxBy, sortBy} from 'lodash';

/** JsonBlob type of a blueprint's draft, named by the blueprint's ID. */
export const BLUEPRINT_TYPE = 'toolboxBlueprint';

/** JsonBlob type of one publish of a blueprint, named `<id>:<n>`. */
export const PUBLISH_TYPE = 'toolboxBlueprintPublish';

/** JsonBlob type of one user's personalization, named `<id>|<preset>`. */
export const PERSONALIZATION_TYPE = 'toolboxBlueprintPersonalization';

/**
 * A {@link BlueprintRepository} on Hoist JsonBlobs.
 *
 * - **Writes:** a blueprint belongs to the user who created it, its JsonBlobs' owner. Only that
 *   user may save, publish or delete it, as hoist-core lets only a blob's owner write it. Every
 *   other user has read access: they run its latest publish, and may copy it into a blueprint of
 *   their own. Summaries and records say so, and `canPublish` follows the owner.
 * - **Listing and access:** drafts and publishes are shared with all users (`acl: '*'`), so
 *   {@link listAsync} lists every blueprint. hoist-core's ACL is the only boundary: this class
 *   refuses readers in its own methods, but cannot keep them from reading a blob directly.
 * - **Drafts are not secret.** A draft is readable by any user through the JsonBlob API. The
 *   library keeps readers off drafts in the UI only.
 * - **Personalizations** are private blobs of their user, one per blueprint and preset.
 * - **Publishes** never change. Each takes the next number, created only if no publish of that
 *   number exists. hoist-core refuses a second active blob of the same type, owner and name, so
 *   on a collision this class reads the publishes again and tries the next number.
 * - **Saves** have no compare-and-set on the server, so `enforcesBase` is false and the library
 *   checks the draft's version first. This class checks it again, and after saving reads the
 *   draft back, warning if another save landed in between.
 * - **Deleting** archives the draft, its publishes and the owner's personalizations. Other users'
 *   personalizations cannot be archived by the owner. They are ignored once their blueprint is
 *   gone, and archived when their own user next loads them.
 */
export class JsonBlobBlueprintRepository implements BlueprintRepository {
    readonly enforcesBase = false;
    private readonly username: () => string;

    constructor(config: {username?: () => string} = {}) {
        this.username = config.username ?? (() => XH.getUsername());
    }

    async listAsync(): Promise<BlueprintSummary[]> {
        const drafts = await XH.jsonBlobService.listAsync({type: BLUEPRINT_TYPE});
        return sortBy(
            drafts.map(it => this.summaryOf(it)),
            it => it.name.toLowerCase()
        );
    }

    async canCreateAsync(): Promise<boolean> {
        return !!this.username();
    }

    async openAsync(id: string, opts: BlueprintOpenOptions): Promise<BlueprintRecord> {
        const stub = await this.draftStubAsync(id);
        if (!stub || (needsWrite(opts) && !this.isOwner(stub))) return null;

        if (opts.as === 'draft') {
            const draft = await XH.jsonBlobService.getAsync(stub.token);
            return {
                ...this.summaryOf(draft),
                blueprint: draft.value.blueprint,
                kind: 'draft',
                version: metaOf(draft).draftVersion,
                pendingRenames: draft.value.pendingRenames ?? []
            };
        }

        const stubs = await this.publishStubsAsync(id),
            pubStub =
                opts.version != null
                    ? stubs.find(it => metaOf(it).version === opts.version)
                    : maxBy(stubs, it => metaOf(it).version);
        if (!pubStub) return null;
        const publish = await XH.jsonBlobService.getAsync(pubStub.token);
        return {
            ...this.summaryOf(stub),
            blueprint: publish.value.blueprint,
            kind: 'publish',
            version: metaOf(publish).version,
            pendingRenames: []
        };
    }

    async createAsync(spec: {
        name: string;
        description?: string;
        blueprint: Blueprint;
        copiedFrom?: BlueprintSummary['copiedFrom'];
    }): Promise<BlueprintRecord> {
        const id = `bp-${XH.genId()}`;
        await XH.jsonBlobService.createAsync({
            type: BLUEPRINT_TYPE,
            name: id,
            acl: '*',
            value: {blueprint: spec.blueprint, pendingRenames: []},
            meta: {
                name: spec.name,
                ...(spec.description ? {description: spec.description} : {}),
                draftVersion: 1,
                publishedVersion: null,
                updated: Date.now(),
                updatedBy: this.username(),
                ...(spec.copiedFrom ? {copiedFrom: spec.copiedFrom} : {})
            }
        });
        return this.openAsync(id, {as: 'draft'});
    }

    async saveDraftAsync(
        id: string,
        draft: {blueprint: Blueprint; base: number; renames: BlueprintRename[]}
    ): Promise<BlueprintSaveResult> {
        const stub = await this.draftStubAsync(id);
        if (!stub) return {issues: [missing(id)]};
        if (!this.isOwner(stub)) return {issues: [notAllowed('save the draft')]};
        const current = metaOf(stub).draftVersion;
        if (draft.base !== current) return {issues: [staleBaseIssue(draft.base, current)]};

        const version = current + 1;
        await XH.jsonBlobService.updateAsync(stub.token, {
            value: {blueprint: draft.blueprint, pendingRenames: draft.renames},
            meta: {...metaOf(stub), draftVersion: version, ...this.touched()}
        });
        return {version, issues: await this.racedIssuesAsync(stub.token, version)};
    }

    async publishAsync(
        id: string,
        opts: {base: number; note?: string}
    ): Promise<BlueprintPublishResult> {
        const stub = await this.draftStubAsync(id);
        if (!stub) return {issues: [missing(id)]};
        if (!this.isOwner(stub)) return {issues: [notAllowed('publish')]};
        const current = metaOf(stub).draftVersion;
        if (opts.base !== current) return {issues: [staleBaseIssue(opts.base, current)]};

        const draft = await XH.jsonBlobService.getAsync(stub.token),
            info = await this.createPublishAsync(id, draft, opts.note),
            draftVersion = current + 1;
        await XH.jsonBlobService.updateAsync(stub.token, {
            value: {...draft.value, pendingRenames: []},
            meta: {
                ...metaOf(draft),
                draftVersion,
                publishedVersion: info.version,
                ...this.touched()
            }
        });
        return {
            publish: info,
            draftVersion,
            issues: await this.racedIssuesAsync(stub.token, draftVersion)
        };
    }

    async listPublishesAsync(id: string): Promise<BlueprintPublish[]> {
        const stubs = await this.publishStubsAsync(id);
        return sortBy(
            stubs.map(it => publishOf(metaOf(it))),
            it => it.version
        );
    }

    async copyAsync(
        id: string,
        opts: {name: string; from?: BlueprintOpenOptions}
    ): Promise<BlueprintRecord> {
        const source = await this.openAsync(id, opts.from ?? {as: 'publish'});
        if (!source) return null;
        return this.createAsync({
            name: opts.name,
            description: source.description,
            blueprint: source.blueprint,
            copiedFrom: {id, version: source.version, as: source.kind}
        });
    }

    async deleteAsync(id: string): Promise<void> {
        const stub = await this.draftStubAsync(id);
        if (!stub) return;
        if (!this.isOwner(stub)) throw new Error('Only its owner can delete a blueprint.');

        const publishes = await this.publishStubsAsync(id),
            personalizations = await this.personalizationStubsAsync(id);
        await Promise.all(
            [...publishes, ...personalizations].map(it => XH.jsonBlobService.archiveAsync(it.token))
        );
        await XH.jsonBlobService.archiveAsync(stub.token);
    }

    async loadPersonalizationsAsync(blueprintId: string): Promise<BlueprintPersonalization[]> {
        const stubs = await this.personalizationStubsAsync(blueprintId, true);
        if (stubs.length && !(await this.draftStubAsync(blueprintId))) {
            await Promise.all(stubs.map(it => XH.jsonBlobService.archiveAsync(it.token)));
            return [];
        }
        return sortBy(
            stubs.map(it => it.value as BlueprintPersonalization),
            it => it.preset ?? ''
        );
    }

    async savePersonalizationAsync(p: BlueprintPersonalization): Promise<void> {
        await XH.jsonBlobService.createOrUpdateAsync(
            PERSONALIZATION_TYPE,
            `${p.blueprintId}|${p.preset ?? ''}`,
            {value: p, meta: {blueprintId: p.blueprintId}}
        );
    }

    //------------------
    // Implementation
    //------------------
    private isOwner(blob: JsonBlob): boolean {
        return blob.owner === this.username();
    }

    private summaryOf(blob: JsonBlob): BlueprintSummary {
        const meta = metaOf(blob),
            owner = this.isOwner(blob);
        return {
            id: blob.name,
            name: meta.name,
            ...(meta.description ? {description: meta.description} : {}),
            draftVersion: meta.draftVersion,
            publishedVersion: meta.publishedVersion ?? null,
            access: owner ? 'write' : 'read',
            canPublish: owner,
            canShare: owner,
            updated: meta.updated,
            updatedBy: meta.updatedBy,
            ...(meta.copiedFrom ? {copiedFrom: meta.copiedFrom} : {}),
            ...(owner ? {sharing: {writers: [blob.owner], readers: ['*']}} : {})
        };
    }

    private touched() {
        return {updated: Date.now(), updatedBy: this.username()};
    }

    private async draftStubAsync(id: string): Promise<JsonBlob> {
        const drafts = await XH.jsonBlobService.listAsync({type: BLUEPRINT_TYPE});
        return drafts.find(it => it.name === id) ?? null;
    }

    private async publishStubsAsync(id: string): Promise<JsonBlob[]> {
        const publishes = await XH.jsonBlobService.listAsync({type: PUBLISH_TYPE});
        return publishes.filter(it => metaOf(it).blueprintId === id);
    }

    private async personalizationStubsAsync(id: string, includeValue = false) {
        const all = await XH.jsonBlobService.listAsync({type: PERSONALIZATION_TYPE, includeValue});
        return all.filter(it => this.isOwner(it) && metaOf(it).blueprintId === id);
    }

    // Create the next publish, taking a later number if another publish has taken this one.
    private async createPublishAsync(
        id: string,
        draft: JsonBlob,
        note: string
    ): Promise<BlueprintPublish> {
        for (let attempt = 0; attempt < 5; attempt++) {
            const taken = (await this.publishStubsAsync(id)).map(
                    it => metaOf(it).version as number
                ),
                version = Math.max(0, ...taken) + 1,
                info: BlueprintPublish = {
                    version,
                    published: Date.now(),
                    publishedBy: this.username(),
                    ...(note ? {note} : {}),
                    renames: draft.value.pendingRenames ?? []
                };
            try {
                await XH.jsonBlobService.createAsync({
                    type: PUBLISH_TYPE,
                    name: `${id}:${version}`,
                    acl: '*',
                    value: {blueprint: draft.value.blueprint},
                    meta: {blueprintId: id, ...info}
                });
                return info;
            } catch (e) {
                if (attempt === 4) throw e;
            }
        }
    }

    // A warning if another save landed between this one and reading the draft back.
    private async racedIssuesAsync(token: string, version: number): Promise<BlueprintIssue[]> {
        const after = await XH.jsonBlobService.getAsync(token);
        return metaOf(after).draftVersion === version
            ? []
            : [
                  {
                      code: 'repository.concurrentSave',
                      severity: 'warning',
                      path: '',
                      message: `Another save landed as this one did: the draft is now at version ${metaOf(after).draftVersion}. Open it again to see it.`
                  }
              ];
    }
}

function metaOf(blob: JsonBlob): PlainObject {
    return (blob.meta ?? {}) as PlainObject;
}

function publishOf(meta: PlainObject): BlueprintPublish {
    const {version, published, publishedBy, note, renames} = meta;
    return {
        version,
        published,
        ...(publishedBy ? {publishedBy} : {}),
        ...(note ? {note} : {}),
        renames: renames ?? []
    };
}

function needsWrite(opts: BlueprintOpenOptions): boolean {
    return opts.as === 'draft' || (opts.as === 'publish' && opts.version != null);
}

function notAllowed(what: string): BlueprintIssue {
    return {
        code: 'edit.notAllowed',
        severity: 'error',
        path: '',
        message: `Only its owner may ${what}.`
    };
}

function missing(id: string): BlueprintIssue {
    return {
        code: 'repository.unknown',
        severity: 'error',
        path: '',
        message: `There is no blueprint '${id}'.`
    };
}
