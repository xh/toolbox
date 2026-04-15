import {library} from '@fortawesome/fontawesome-svg-core';
import {faMarkdown} from '@fortawesome/free-brands-svg-icons';
import {p, span, vbox} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {codeInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {wrapper} from '../../common';
import './MarkdownPanel.scss';
import content from './MarkdownPanelContent.md';

library.add(faMarkdown);

export const markdownPanel = hoistCmp.factory({
    displayName: 'MarkdownPanel',
    model: creates(() => MarkdownModel),

    render({model}) {
        return wrapper({
            description: p(
                'Hoist supplies a markdown component that wraps the react-markdown library and will convert a markdown string into a React element tree.'
            ),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/MarkdownPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/markdown/Markdown.ts', notes: 'Hoist component.'},
                {
                    url: '$TB/client-app/src/desktop/tabs/other/MarkdownPanel.scss',
                    notes: 'Custom styles applied via toggle.'
                },
                {
                    url: '$TB/client-app/src/types.d.ts',
                    notes: 'Module declaration for .md file imports.'
                }
            ],
            item: vbox({
                width: 800,
                height: '80%',
                gap: true,
                items: [
                    panel({
                        title: 'Rendered Markdown',
                        icon: Icon.icon({prefix: 'fab', iconName: 'markdown'}),
                        className: model.useCustomStyles ? 'tb-markdown-panel--styled' : undefined,
                        modelConfig: {
                            modalSupport: true,
                            collapsible: false,
                            resizable: false
                        },
                        tbar: toolbar(
                            span('Custom styles'),
                            switchInput({bind: 'useCustomStyles'}),
                            model.useCustomStyles
                                ? span({
                                      style: {
                                          color: 'var(--xh-text-color-muted)',
                                          fontSize: '0.85em'
                                      },
                                      item: 'App-provided CSS class applied to rendered output'
                                  })
                                : null
                        ),
                        flex: 3,
                        scrollable: true,
                        contentBoxProps: {padding: '10px 20px'},
                        item: markdown({content: model.content, lineBreaks: false})
                    }),
                    panel({
                        title: 'Source Text',
                        icon: Icon.edit(),
                        flex: 2,
                        item: codeInput({
                            bind: 'content',
                            commitOnChange: true,
                            width: '100%',
                            height: '100%'
                        })
                    })
                ]
            })
        });
    }
});

class MarkdownModel extends HoistModel {
    @bindable accessor content: string = '';
    @bindable accessor useCustomStyles: boolean = false;

    constructor() {
        super();

        fetch(content)
            .then(response => response.text())
            .then(text => (this.content = text));
    }
}
