import type {
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
    const undone = new Set<number>();
    history.forEach(it => {
        if (it.undoes != null) undone.add(it.undoes);
        if (it.redoes != null) undone.delete(it.redoes);
    });
    const edits: TimelineRow[] = history.map(it => ({
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
