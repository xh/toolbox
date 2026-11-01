import {isBoolean, isNil, isNumber, isString} from 'lodash';
import type {DemoConfigValue} from '../../../common/Demo';
import {raw} from '../../../common/Demo';

/**
 * Helpers for the nested props of a Playground snippet, such as `composerProps`, which
 * `fmtDemoConfig` takes as `raw()` code. Each returns code written from column 0, with any
 * further lines indented to match. `snippet()` shifts that code to sit at a prop of the snippet.
 */

/** Code for an object literal of the given props, or null if every value is undefined. */
export function objectLiteral(props: Record<string, DemoConfigValue>): string {
    const parts = Object.entries(props)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}: ${literal(v)}`);
    if (!parts.length) return null;

    const oneLine = `{${parts.join(', ')}}`;
    return oneLine.length <= MAX_LINE && !oneLine.includes('\n')
        ? oneLine
        : `{\n${parts.map(it => indent(it)).join(',\n')}\n}`;
}

/** Code for an array literal of the given items, as values or code. */
export function arrayLiteral(items: DemoConfigValue[]): string {
    const parts = items.map(literal),
        oneLine = `[${parts.join(', ')}]`;
    return oneLine.length <= MAX_LINE && !oneLine.includes('\n')
        ? oneLine
        : `[\n${parts.map(it => indent(it)).join(',\n')}\n]`;
}

/** Code for one value: a quoted string, a number or boolean, null, or `raw()` code as given. */
export function literal(v: DemoConfigValue): string {
    if (isNil(v)) return 'null';
    if (isString(v))
        return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
    if (isNumber(v) || isBoolean(v)) return String(v);
    return v.raw;
}

/** Code for a prop of a `fmtDemoConfig` snippet, or undefined to leave the prop out. */
export function snippet(code: string): {raw: string} {
    return isNil(code) ? undefined : raw(code.replace(/\n/g, '\n    '));
}

/** An object literal for a prop of a `fmtDemoConfig` snippet, or undefined if it is empty. */
export function rawObject(props: Record<string, DemoConfigValue>): {raw: string} {
    return snippet(objectLiteral(props));
}

//------------------
// Implementation
//------------------
const MAX_LINE = 64;

function indent(code: string): string {
    return code
        .split('\n')
        .map(it => `    ${it}`)
        .join('\n');
}
