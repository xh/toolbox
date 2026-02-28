import {hoistCmp, creates} from '@xh/hoist/core';
import {div, frame} from '@xh/hoist/cmp/layout';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {WeatherWidgetModel} from '../dash/WeatherWidgetModel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {WidgetMeta} from '../dash/types';

//--------------------------------------------------
// Model
//--------------------------------------------------
export class MarkdownContentModel extends WeatherWidgetModel {
    static override meta: WidgetMeta = {
        id: 'markdownContent',
        title: 'Markdown Content',
        description:
            'Static rich-text display. Useful for dashboard titles, instructions, or annotations.',
        category: 'utility',
        inputs: [],
        outputs: [],
        config: {
            content: {
                type: 'string',
                description: 'Markdown text to render.',
                default: "# Welcome\nEdit this widget's content in the dashboard spec."
            }
        },
        defaultSize: {w: 4, h: 3},
        minSize: {w: 2, h: 1}
    };

    @bindable content: string = "# Welcome\nEdit this widget's content in the dashboard spec.";

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        super.onLinked();
        this.markPersist('content');
    }
}

widgetRegistry.register(MarkdownContentModel.meta);

//--------------------------------------------------
// Component
//--------------------------------------------------
export const markdownContentWidget = hoistCmp.factory({
    displayName: 'MarkdownContentWidget',
    model: creates(MarkdownContentModel),

    render({model}) {
        // Simple markdown rendering — supports basic formatting via innerHTML.
        // For V1, we render plain text with line breaks. A full markdown renderer
        // (e.g., marked or react-markdown) can be added as a stretch goal.
        const html = simpleMarkdownToHtml(model.content);
        return frame({
            padding: 12,
            style: {overflow: 'auto'},
            item: div({
                style: {lineHeight: 1.5},
                dangerouslySetInnerHTML: {__html: html}
            })
        });
    }
});

/**
 * Minimal markdown-to-HTML converter for basic formatting.
 * Handles headings, bold, italic, links, and line breaks.
 */
function simpleMarkdownToHtml(md: string): string {
    if (!md) return '';
    return md
        .split('\n')
        .map(line => {
            // Headings
            if (line.startsWith('### ')) return `<h3>${esc(line.slice(4))}</h3>`;
            if (line.startsWith('## ')) return `<h2>${esc(line.slice(3))}</h2>`;
            if (line.startsWith('# ')) return `<h1>${esc(line.slice(2))}</h1>`;
            // Empty line = paragraph break
            if (!line.trim()) return '<br/>';
            // Bold and italic
            let html = esc(line);
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
            return `<p style="margin:0">${html}</p>`;
        })
        .join('');
}

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
