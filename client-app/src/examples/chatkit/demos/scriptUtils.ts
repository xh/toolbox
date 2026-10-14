import {last} from 'lodash';

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
// Implementation
//------------------
const UNJOINABLE_RE = /^(#{1,6}\s|\||```)/,
    BLOCK_START_RE = /^(#{1,6}\s|\||>|```|\s*[-*+]\s|\s*\d+\.\s)/;
