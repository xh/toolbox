import {isBoolean, isNil, isNumber, isString, last} from 'lodash';
import type {DemoConfigValue} from '../../../common/Demo';
import {raw} from '../../../common/Demo';

/**
 * Helpers shared by the Chat Kit tab's demos: `markdown()` for the scripted replies, and builders
 * for the nested props of a Playground snippet.
 */

//------------------
// Scripted content
//------------------
/**
 * Markdown written inline in a template literal, as a model would send it: the indent is
 * stripped, and lines wrapped for the source are joined back into paragraphs, list items and
 * quotes. Code blocks, headings and tables keep their lines.
 */
export function markdown(text: string): string {
    const lines = text.replace(/^\n/, '').trimEnd().split('\n'),
        indent = Math.min(...lines.filter(it => it.trim()).map(it => it.match(/^ */)[0].length)),
        ret: string[] = [];

    let inCode = false;
    lines.forEach(rawLine => {
        const line = rawLine.slice(indent),
            prev = last(ret);
        if (line.startsWith('```')) inCode = !inCode;

        if (inCode || line.startsWith('```') || !prev?.trim() || !line.trim()) {
            ret.push(line);
        } else if (UNJOINABLE_RE.test(prev)) {
            ret.push(line);
        } else if (line.startsWith('> ') && prev.startsWith('>')) {
            ret[ret.length - 1] += ' ' + line.slice(2);
        } else if (BLOCK_START_RE.test(line)) {
            ret.push(line);
        } else {
            ret[ret.length - 1] += ' ' + line.trim();
        }
    });
    return ret.join('\n');
}

//------------------
// Snippet code
//------------------
// For the nested props of a Playground snippet, such as `composerProps`, which `fmtDemoConfig`
// takes as `raw()` code. Each returns code written from column 0, with any further lines indented
// to match. `snippet()` shifts that code to sit at a prop of the snippet.

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
const UNJOINABLE_RE = /^(#{1,6}\s|\||```)/,
    BLOCK_START_RE = /^(#{1,6}\s|\||>|```|\s*[-*+]\s|\s*\d+\.\s)/,
    MAX_LINE = 64;

/** Code for one value: a quoted string, a number or boolean, null, or `raw()` code as given. */
function literal(v: DemoConfigValue): string {
    if (isNil(v)) return 'null';
    if (isString(v))
        return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
    if (isNumber(v) || isBoolean(v)) return String(v);
    return v.raw;
}

function indent(code: string): string {
    return code
        .split('\n')
        .map(it => `    ${it}`)
        .join('\n');
}
