import type {BlueprintDiff, BlueprintPublish, BlueprintRename} from '@xh/hoist-chat-kit/blueprint';

/** One change of a comparison, for a person to read and, where it names one, to reveal. */
export interface DiffRow {
    kind: 'element' | 'source' | 'variable' | 'preset' | 'format' | 'other';
    change: 'added' | 'removed' | 'renamed' | 'changed';
    /** The id it names, in the later version, or null for a top-level key. */
    id: string;
    text: string;
}

/**
 * The renames between a publish and a later one, or the draft: those of each publish after
 * `from`, up to `to`, in order, then the draft's pending renames when comparing with the draft.
 */
export function renamesBetween(
    publishes: BlueprintPublish[],
    from: number,
    to: number | 'draft',
    pendingRenames: BlueprintRename[]
): BlueprintRename[] {
    const upTo = to === 'draft' ? Infinity : to;
    return [
        ...publishes
            .filter(it => it.version > from && it.version <= upTo)
            .flatMap(it => it.renames ?? []),
        ...(to === 'draft' ? pendingRenames : [])
    ];
}

/** A comparison's changes as rows, part by part in a fixed order. */
export function diffRows(diff: BlueprintDiff): DiffRow[] {
    const parts: [DiffRow['kind'], keyof BlueprintDiff][] = [
        ['element', 'elements'],
        ['source', 'sources'],
        ['variable', 'variables'],
        ['preset', 'presets'],
        ['format', 'formats']
    ];
    return [
        ...parts.flatMap(([kind, key]) => {
            const part = diff[key] as BlueprintDiff['elements'];
            return [
                ...part.added.map(id => ({kind, change: 'added' as const, id, text: id})),
                ...part.removed.map(id => ({kind, change: 'removed' as const, id, text: id})),
                ...part.renamed.map(({from, to}) => ({
                    kind,
                    change: 'renamed' as const,
                    id: to,
                    text: `${from} → ${to}`
                })),
                ...part.changed.map(({id, paths}) => ({
                    kind,
                    change: 'changed' as const,
                    id,
                    text: `${id}: ${paths.map(it => it.replace(/^\//, '')).join(', ')}`
                }))
            ];
        }),
        ...diff.other.map(key => ({
            kind: 'other' as const,
            change: 'changed' as const,
            id: null,
            text: key
        }))
    ];
}
