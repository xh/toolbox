import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {diffOps} from '@xh/hoist-chat-kit/blueprint';
import {isEqual, isPlainObject, isString, keyBy, uniq} from 'lodash';

export interface CompareRow {
    /** JSON Pointer of the value that changed. */
    path: string;
    change: 'added' | 'removed' | 'changed';
    /** The value as JSON, or null where there was none. */
    before: string;
    after: string;
}

/**
 * How one blueprint differs from another: one row per value changed, in `diffOps` order. An array
 * of objects with ids, such as child references, is keyed by id, as `path[id]`: a row per object
 * added or removed, and per key changed.
 */
export function compareRows(from: Blueprint, to: Blueprint): CompareRow[] {
    return diffOps(from, to).flatMap(op => {
        const before = valueAt(from, op.path),
            after = op.op === 'set' ? op.value : undefined;
        return isRefList(before) && isRefList(after)
            ? refRows(op.path, before, after)
            : [row(op.path, before, after)];
    });
}

type Ref = {id: string; [key: string]: unknown};

function isRefList(v: unknown): v is Ref[] {
    return Array.isArray(v) && v.length > 0 && v.every(it => isPlainObject(it) && isString(it.id));
}

function refRows(path: string, before: Ref[], after: Ref[]): CompareRow[] {
    const was = keyBy(before, 'id'),
        now = keyBy(after, 'id'),
        ids = uniq([...before, ...after].map(it => it.id));
    return ids.flatMap(id => {
        const at = `${path}[${id}]`,
            a = was[id],
            b = now[id];
        if (!a || !b) return [row(at, a, b)];
        return uniq([...Object.keys(a), ...Object.keys(b)])
            .filter(key => !isEqual(a[key], b[key]))
            .map(key => row(`${at}/${key}`, a[key], b[key]));
    });
}

function row(path: string, before: unknown, after: unknown): CompareRow {
    return {
        path,
        change: before === undefined ? 'added' : after === undefined ? 'removed' : 'changed',
        before: json(before),
        after: json(after)
    };
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
