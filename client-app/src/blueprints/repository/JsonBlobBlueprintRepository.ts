import type {
    Blueprint,
    BlueprintAccessSpec,
    BlueprintCreateSpec,
    BlueprintIssue,
    BlueprintOpenOptions,
    BlueprintPersonalization,
    BlueprintPublish,
    BlueprintPublishResult,
    BlueprintRecord,
    BlueprintRename,
    BlueprintRepository,
    BlueprintSaveResult,
    BlueprintSharingMode,
    BlueprintSummary
} from '@xh/hoist-chat-kit/blueprint';
import {checkBlueprintType, staleBaseIssue} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import type {JsonBlob} from '@xh/hoist/svc';
import {isEqual, maxBy, sortBy} from 'lodash';

/**
 * The JsonBlob types that hold blueprints of one blueprint type: each draft, named by the
 * blueprint's ID; each publish, named `<id>:<n>`; and each user's personalization, named
 * `<id>|<preset>`. A blueprint type is dotted, as the kit requires, and here at most 25 characters,
 * tighter than the kit's 50, so `blueprintPersonalization.<type>` fits hoist-core's 50-character
 * JsonBlob type. Throws on a type that is not.
 */
export function jsonBlobTypes(type: string): {
    draft: string;
    publish: string;
    personalization: string;
} {
    const ret = {
        draft: `blueprint.${type}`,
        publish: `blueprintPublish.${type}`,
        personalization: `blueprintPersonalization.${type}`
    };
    checkBlueprintType(type);
    if (type.length > 25) {
        throw new Error(`A blueprint type in JsonBlobs is at most 25 characters: '${type}'.`);
    }
    return ret;
}

/**
 * A {@link BlueprintRepository} on Hoist JsonBlobs.
 *
 * - **Writes:** a blueprint belongs to the user who created it, its JsonBlobs' owner. Only that
 *   user may save, publish, share or delete it, as hoist-core lets only a blob's owner write it.
 *   Summaries and records say so, and `canPublish` and `canShare` follow the owner.
 * - **Sharing** is private or global only (`sharingModes` is `everyone`). A new blueprint is
 *   private: its blobs' ACL is unset, so only the owner reads them. Global sets `acl: '*'` on the
 *   draft and every publish, and later publishes take the draft's ACL. Every other user then runs
 *   its latest publish, and may copy it into a blueprint of their own.
 * - **Listing:** {@link listAsync} lists the user's own blueprints, and global ones once they have
 *   a publish. hoist-core's ACL is the only boundary: this class refuses readers in its own
 *   methods, but cannot keep them from reading a global blob directly.
 * - **A global draft is not secret.** It is readable by any user through the JsonBlob API. The
 *   library keeps readers off drafts in the UI only.
 * - **Personalizations** are private blobs of their user, one per blueprint and preset.
 * - **Publishes** never change. Each takes the next number, created only if no publish of that
 *   number exists. hoist-core refuses a second active blob of the same type, owner and name, so
 *   on a collision this class reads the publishes again and tries the next number.
 * - **Saves** have no compare-and-set on the server, so `enforcesBase` is false and the library
 *   checks the draft's version first. This class reads the draft just before writing it, checks
 *   the version again, keeps the meta it read but its version, and after saving reads the draft
 *   back, warning if another save landed in between.
 * - **Publishing is not atomic.** It creates the publish blob, then updates the draft's meta with
 *   the new version and published number. If that second write fails, the publish stands but the
 *   draft's version is not bumped. A save between the two reads, such as from the owner's other
 *   tab, can land in the publish or be overwritten. Only the owner writes, so the window is narrow.
 * - **Deleting** archives the draft, its publishes and the owner's personalizations. Other users'
 *   personalizations cannot be archived by the owner. They are ignored once their blueprint is
 *   gone, and archived when their own user next loads them.
 * - **Every call lists every blob of a type**, all drafts or all publishes, and filters in the
 *   browser. That suits a small library like Toolbox's. A larger one wants a server endpoint that
 *   queries by blueprint.
 */
export class JsonBlobBlueprintRepository implements BlueprintRepository {
    readonly enforcesBase = false;
    readonly sharingModes: BlueprintSharingMode[] = ['everyone'];
    readonly type: string;
    private readonly username: () => string;
    private readonly types: ReturnType<typeof jsonBlobTypes>;

    /**
     * @param config.type - the blueprint type the repository holds. Blueprints of other types
     *      are in other JsonBlob types, which it never reads.
     */
    constructor(config: {type: string; username?: () => string}) {
        this.type = config.type;
        this.types = jsonBlobTypes(config.type);
        this.username = config.username ?? (() => XH.getUsername());
    }

    async listAsync(): Promise<BlueprintSummary[]> {
        const drafts = await XH.jsonBlobService.listAsync({type: this.types.draft});
        return sortBy(
            drafts
                .filter(it => this.isOwner(it) || metaOf(it).publishedVersion != null)
                .map(it => this.summaryOf(it)),
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

    async createAsync(spec: BlueprintCreateSpec): Promise<BlueprintRecord> {
        const drafts = await XH.jsonBlobService.listAsync({type: this.types.draft});
        if (drafts.some(it => this.isOwner(it) && metaOf(it).name === spec.name)) {
            throw Object.assign(new Error(`You already have a blueprint named '${spec.name}'.`), {
                httpStatus: 400
            });
        }
        const id = `bp-${XH.genId()}`;
        await XH.jsonBlobService.createAsync({
            type: this.types.draft,
            name: id,
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
        const fresh = await XH.jsonBlobService.getAsync(stub.token),
            current = metaOf(fresh).draftVersion;
        if (draft.base !== current) return {issues: [staleBaseIssue(draft.base, current)]};

        const version = current + 1;
        await XH.jsonBlobService.updateAsync(stub.token, {
            value: {blueprint: draft.blueprint, pendingRenames: draft.renames},
            meta: {...metaOf(fresh), draftVersion: version, ...this.touched()}
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
        const draft = await XH.jsonBlobService.getAsync(stub.token),
            current = metaOf(draft).draftVersion;
        if (opts.base !== current) return {issues: [staleBaseIssue(opts.base, current)]};

        const info = await this.createPublishAsync(id, draft, opts.note),
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

    async renameAsync(
        id: string,
        spec: {name: string; description?: string}
    ): Promise<BlueprintSummary> {
        const drafts = await XH.jsonBlobService.listAsync({type: this.types.draft}),
            stub = drafts.find(it => it.name === id);
        if (!stub) throw new Error(`There is no blueprint '${id}'.`);
        if (!this.isOwner(stub)) throw new Error('Only its owner can rename a blueprint.');
        if (drafts.some(it => it !== stub && this.isOwner(it) && metaOf(it).name === spec.name)) {
            throw Object.assign(new Error(`You already have a blueprint named '${spec.name}'.`), {
                httpStatus: 400
            });
        }
        const meta: PlainObject = {...metaOf(stub), name: spec.name, ...this.touched()};
        if (spec.description !== undefined) meta.description = spec.description;
        const updated = await XH.jsonBlobService.updateAsync(stub.token, {meta});
        return this.summaryOf(updated);
    }

    async updateAccessAsync(id: string, spec: BlueprintAccessSpec): Promise<void> {
        const global = isEqual(spec, GLOBAL);
        if (!global && !isEqual(spec, PRIVATE)) {
            throw new Error(
                'A blueprint here is private or shared with everyone, nothing between.'
            );
        }
        const stub = await this.draftStubAsync(id);
        if (!stub) throw new Error(`There is no blueprint '${id}'.`);
        if (!this.isOwner(stub)) throw new Error('Only its owner can share a blueprint.');

        const acl = global ? '*' : null,
            publishes = await this.publishStubsAsync(id);
        await Promise.all(
            [stub, ...publishes].map(it => XH.jsonBlobService.updateAsync(it.token, {acl}))
        );
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
            this.types.personalization,
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
            type: this.type,
            name: meta.name,
            owner: blob.owner,
            ...(meta.description ? {description: meta.description} : {}),
            draftVersion: meta.draftVersion,
            publishedVersion: meta.publishedVersion ?? null,
            access: owner ? 'write' : 'read',
            canPublish: owner,
            canShare: owner,
            canShareGlobally: owner,
            updated: meta.updated,
            updatedBy: meta.updatedBy,
            ...(meta.copiedFrom ? {copiedFrom: meta.copiedFrom} : {}),
            ...(owner ? {sharing: blob.acl === '*' ? GLOBAL : PRIVATE} : {})
        };
    }

    private touched() {
        return {updated: Date.now(), updatedBy: this.username()};
    }

    private async draftStubAsync(id: string): Promise<JsonBlob> {
        const drafts = await XH.jsonBlobService.listAsync({type: this.types.draft});
        return drafts.find(it => it.name === id) ?? null;
    }

    private async publishStubsAsync(id: string): Promise<JsonBlob[]> {
        const publishes = await XH.jsonBlobService.listAsync({type: this.types.publish});
        return publishes.filter(it => metaOf(it).blueprintId === id);
    }

    private async personalizationStubsAsync(id: string, includeValue = false) {
        const all = await XH.jsonBlobService.listAsync({
            type: this.types.personalization,
            includeValue
        });
        return all.filter(it => this.isOwner(it) && metaOf(it).blueprintId === id);
    }

    // Create the next publish, taking a later number if another publish takes this one first.
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
                    type: this.types.publish,
                    name: `${id}:${version}`,
                    acl: draft.acl,
                    value: {blueprint: draft.value.blueprint},
                    meta: {blueprintId: id, ...info}
                });
                return info;
            } catch (e) {
                // Retry only if another publish took this number, which hoist-core refuses.
                const taker = (await this.publishStubsAsync(id)).find(
                    it => metaOf(it).version === version
                );
                if (!taker || attempt === 4) throw e;
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

const PRIVATE: BlueprintAccessSpec = {writers: [], readers: []},
    GLOBAL: BlueprintAccessSpec = {writers: [], readers: ['*']};

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
