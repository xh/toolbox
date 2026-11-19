import {chatMarkdown} from '@xh/hoist-chat-kit/cmp/markdown';
import type {ColumnSpec} from '@xh/hoist/cmp/grid';
import type {ReactElement} from 'react';

/** Render registry and catalog prose as Markdown, as the Architect chat does. Null for no text. */
export function md(text: string): ReactElement {
    return text ? chatMarkdown({content: text, className: 'tb-markdown'}) : null;
}

/** A grid column of Markdown prose: one line in the cell, in full in the tooltip. */
export function markdownCol(spec: ColumnSpec): ColumnSpec {
    return {...spec, cellClass: 'tb-markdown-cell', renderer: v => md(v), tooltip: v => md(v)};
}
