import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {diffOps} from '@xh/hoist-chat-kit/blueprint';

export interface CompareRow {
    /** JSON Pointer of the value that changed. */
    path: string;
    change: 'added' | 'removed' | 'changed';
    /** The value as JSON, or null where there was none. */
    before: string;
    after: string;
}

/** How one blueprint differs from another: one row per value changed, in `diffOps` order. */
export function compareRows(from: Blueprint, to: Blueprint): CompareRow[] {
    return diffOps(from, to).map(op => {
        const before = valueAt(from, op.path),
            after = op.op === 'set' ? op.value : undefined;
        return {
            path: op.path,
            change: before === undefined ? 'added' : after === undefined ? 'removed' : 'changed',
            before: json(before),
            after: json(after)
        };
    });
}

function valueAt(obj: unknown, path: string): unknown {
    return path
        .split('/')
        .slice(1)
        .map(it => it.replace(/~1/g, '/').replace(/~0/g, '~'))
        .reduce((v, key) => (v != null && typeof v === 'object' ? v[key] : undefined), obj);
}

function json(v: unknown): string {
    return v === undefined ? null : JSON.stringify(v);
}
