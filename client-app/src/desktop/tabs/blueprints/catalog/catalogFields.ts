import type {PlainObject} from '@xh/hoist/core';
import {isPlainObject, isString} from 'lodash';

/** Format options as one line, such as `scale: millions, precision: 1, ledger`. */
export function describeFormat(opts: PlainObject): string {
    return Object.entries(opts ?? {})
        .map(([k, v]) => (v === true ? k : `${k}: ${isPlainObject(v) ? JSON.stringify(v) : v}`))
        .join(', ');
}

/** A catalog value that may be a name or an object with options, as one line. */
export function describeSpec(spec: string | PlainObject): string {
    if (spec == null) return '';
    if (isString(spec)) return spec;
    const {name, type, ...rest} = spec,
        head = name ?? type,
        opts = describeFormat(rest);
    return head ? (opts ? `${head} (${opts})` : head) : opts;
}
