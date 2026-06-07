import {library} from '@fortawesome/fontawesome-svg-core';
import {faMarkdown} from '@fortawesome/free-brands-svg-icons';
import {markdown} from '@xh/hoist/cmp/markdown';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {codeInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {wrapper, wrapperOption} from '../../common';
import './MarkdownPanel.scss';
import content from './MarkdownPanelContent.md';

library.add(faMarkdown);

export const markdownPanel = hoistCmp.factory({
    displayName: 'MarkdownPanel',
    model: creates(() => MarkdownModel),

    render({model}) {
        return wrapper({
            title: 'Markdown',
            icon: Icon.icon({prefix: 'fab', iconName: 'markdown'}),
            description: [
                "Hoist's `Markdown` component wraps the `react-markdown` library to render a",
                'Markdown string as a React element tree. Content can be imported directly',
                'from `.md` files or supplied at runtime, and the rendered output can be',
                'styled with your own CSS. Edit the source on the left to see it render live.',
                '',
                'In fact, the description text you are reading right now is itself rendered with',
                '`Markdown` - the Wrapper info rail runs every example description through the',
                'same component.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/MarkdownPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/markdown/Markdown.ts', notes: 'Hoist component.'},
                {
                    url: '$TB/client-app/src/desktop/common/Wrapper.ts',
                    notes: 'Renders each example description in the info rail via the Markdown component.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/other/MarkdownPanel.scss',
                    notes: 'Custom styles applied via toggle.'
                },
                {
                    url: '$TB/client-app/src/types.d.ts',
                    notes: 'Module declaration for .md file imports.'
                },
                {
                    url: 'https://github.com/remarkjs/react-markdown',
                    text: 'react-markdown',
                    notes: 'The underlying Markdown rendering library.'
                }
            ],
            options: wrapperOption({
                label: 'Custom styles',
                control: switchInput({model, bind: 'useCustomStyles'})
            }),
            item: panel({
                className: 'tb-markdown-panel',
                contentBoxProps: {flexDirection: 'row', padding: true, gap: true},
                items: [
                    panel({
                        title: 'Source Text',
                        icon: Icon.edit(),
                        compactHeader: true,
                        flex: 2,
                        minWidth: 0,
                        item: codeInput({
                            bind: 'content',
                            commitOnChange: true,
                            width: '100%',
                            height: '100%'
                        })
                    }),
                    panel({
                        title: 'Rendered Markdown',
                        icon: Icon.icon({prefix: 'fab', iconName: 'markdown'}),
                        compactHeader: true,
                        className: model.useCustomStyles ? 'tb-markdown-panel--styled' : undefined,
                        flex: 3,
                        minWidth: 0,
                        modelConfig: {
                            modalSupport: true,
                            collapsible: false,
                            resizable: false
                        },
                        scrollable: true,
                        contentBoxProps: {padding: '10px 20px'},
                        item: markdown({content: model.content, lineBreaks: false})
                    })
                ]
            })
        });
    }
});

class MarkdownModel extends HoistModel {
    @bindable content: string = '';
    @bindable useCustomStyles: boolean = false;

    constructor() {
        super();
        makeObservable(this);

        fetch(content)
            .then(response => response.text())
            .then(text => (this.content = text));
    }
}
