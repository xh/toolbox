import {hoistCmp, creates} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {BaseWeatherWidgetModel} from './BaseWeatherWidgetModel';
import {settingsAwarePanel} from './settingsAwarePanel';
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
            },
            title: {
                type: 'string',
                description:
                    'Display title for the widget header. Set this to label the widget since its title cannot be auto-generated.',
                default: 'Markdown Content'
            }
        },
        defaultSize: {w: 4, h: 5},
        minSize: {w: 2, h: 2}
    };

    @bindable content: string = "# Welcome\n\nEdit this widget's content in the dashboard spec.";
    @bindable widgetTitle: string = 'Markdown Content';

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        super.onLinked();
        this.markPersist('content');
        this.markPersist('widgetTitle', {path: 'title'});
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
        const content = div({
            className: 'weather-v2-markdown',
            item: markdown({content: model.content, lineBreaks: false})
        });
        return settingsAwarePanel(model, content);
    }
});
