import {div, vbox} from '@xh/hoist/cmp/layout';
import {markdown} from '@xh/hoist/cmp/markdown';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {codeInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import React from 'react';
import {wrapper} from '../../common';
import './JsxPanel.scss';
// @ts-ignore
import content from './MarkdownPanelContent.md';

class MarkdownModel extends HoistModel {
    @bindable content: string = '';

    constructor() {
        super();
        makeObservable(this);

        fetch(content)
            .then(response => response.text())
            .then(text => (this.content = text));
    }
}

export const markdownPanel = hoistCmp.factory({
    model: creates(MarkdownModel),
    render({model}) {
        return wrapper({
            description: [
                <p>
                    Hoist supplies a <code>markdown</code> component that wraps the react-markdown
                    library and will convert a markdown string into a React element tree.
                </p>
            ],
            item: vbox({
                width: 800,
                height: 800,
                style: {gap: '10px'},
                items: [
                    panel({
                        title: 'Source Text',
                        icon: Icon.edit(),
                        flex: 1,
                        item: codeInput({
                            bind: 'content',
                            commitOnChange: true,
                            width: '100%',
                            height: '100%'
                        })
                    }),
                    panel({
                        title: 'Rendered Markdown',
                        icon: Icon.magic(),
                        modelConfig: {
                            modalSupport: true,
                            collapsible: false,
                            resizable: false
                        },
                        flex: 1,
                        item: div({
                            style: {overflowY: 'scroll', padding: '5px 10px'},
                            item: markdown({content: model.content, lineBreaks: false})
                        })
                    })
                ]
            })
        });
    }
});
