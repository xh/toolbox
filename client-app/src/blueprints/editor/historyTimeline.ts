import type {
    BlueprintDesignModel,
    BlueprintEdit,
    BlueprintOp,
    BlueprintPublish,
    BlueprintSelection
} from '@xh/hoist-chat-kit/blueprint';
import {orderBy} from 'lodash';

/** A row of the History tab: an edit, or a publish. */
export interface TimelineRow {
    id: string;
    kind: 'edit' | 'publish';
    version: number;
    /** Epoch millis, or null if unknown. */
    time: number;
    /** `user`, `architect`, or for a publish who published it. */
    author: string;
    description: string;
    note?: string;
    /** True for an edit undone since, and not redone. */
    undone: boolean;
    ops?: BlueprintOp[];
}

const KINDS: Record<string, BlueprintSelection['kind']> = {
    elements: 'element',
    variables: 'variable',
    sources: 'source',
    presets: 'preset'
};

/**
 * The edits since the blueprint opened and its publishes, newest first. Edits carry no time of
 * their own, so `stamps` gives each edit's time by version.
 */
export function historyTimeline(
    history: (BlueprintEdit & {version: number})[],
    publishes: BlueprintPublish[],
    stamps: Record<number, number>
): TimelineRow[] {
    const undone = undoneVersions(history),
        edits: TimelineRow[] = history
            .filter(it => it.undoes == null && it.redoes == null)
            .map(it => ({
                id: `edit-${it.version}`,
                kind: 'edit',
                version: it.version,
                time: stamps[it.version] ?? null,
                author: it.author ?? 'user',
                description: it.description ?? 'Edit',
                undone: undone.has(it.version),
                ops: it.ops
            })),
        pubs: TimelineRow[] = publishes.map(it => ({
            id: `publish-${it.version}`,
            kind: 'publish',
            version: it.version,
            time: it.published,
            author: it.publishedBy ?? null,
            description: `Published v${it.version}`,
            note: it.note,
            undone: false
        }));
    return orderBy([...edits, ...pubs], [it => it.time ?? 0], ['desc']);
}

/**
 * The versions of the edits undone since, and not redone. A redo stands for the edit it applies
 * again, so undoing a redo marks the original.
 */
export function undoneVersions(history: BlueprintEdit[]): Set<number> {
    const ret = new Set<number>(),
        original = originals(history);
    history.forEach(it => {
        if (it.undoes != null) ret.add(original(it.undoes));
        if (it.redoes != null) ret.delete(original(it.redoes));
    });
    return ret;
}

/** Maps a version to the edit it stands for: a redo's original, else itself. */
export function originals(
    history: (BlueprintEdit & {version?: number})[]
): (version: number) => number {
    const of = new Map<number, number>();
    history.forEach(it => {
        if (it.redoes != null && it.version != null)
            of.set(it.version, of.get(it.redoes) ?? it.redoes);
    });
    return version => of.get(version) ?? version;
}

/** What an edit touched first that may still be there: an element, variable, source or preset. */
export function editTarget(ops: BlueprintOp[]): BlueprintSelection {
    for (const op of ops ?? []) {
        switch (op.op) {
            case 'addElement':
            case 'moveElement':
                return {kind: 'element', id: op.id};
            case 'renameId':
                return {kind: op.kind, id: op.to};
            case 'set':
            case 'remove': {
                const [, root, id] = op.path.split('/'),
                    kind = KINDS[root];
                if (kind && id) return {kind, id};
            }
        }
    }
    return null;
}

/** Select what an edit touched first, if it is still there. */
export function revealEdit(designModel: BlueprintDesignModel, ops: BlueprintOp[]) {
    const target = editTarget(ops);
    if (!target) return;
    const root = Object.keys(KINDS).find(it => KINDS[it] === target.kind);
    designModel.revealIssue({
        code: 'edit.show',
        severity: 'warning',
        message: '',
        path: `/${root}/${target.id}`
    });
}
