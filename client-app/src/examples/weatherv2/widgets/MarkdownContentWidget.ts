import {hoistCmp, creates} from '@xh/hoist/core';
import {box} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {BaseWeatherWidgetModel} from './BaseWeatherWidgetModel';
import {widgetRegistry} from '../dash/WidgetRegistry';
import {WidgetMeta} from '../dash/types';

//--------------------------------------------------
// Model
//--------------------------------------------------
export class MarkdownContentModel extends BaseWeatherWidgetModel {
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
                default: "# Welcome\n\nEdit this widget's content in the dashboard spec."
            }
        },
        defaultSize: {w: 4, h: 3},
        minSize: {w: 2, h: 1}
    };

    @bindable content: string = "# Welcome\n\nEdit this widget's content in the dashboard spec.";

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
        return box({
            testId: 'markdown-content',
            className: 'weather-v2-markdown',
            item: markdown({content: model.content, lineBreaks: false})
        });
    }
});
