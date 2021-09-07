import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, hbox, hframe, vbox, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {jsonInput, select} from '@xh/hoist/desktop/cmp/input';
import {mask} from '@xh/hoist/desktop/cmp/mask';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {FetchApiTestModel} from './FetchApiTestModel';
import './FetchApiTestStyles.scss';

export const FetchApiTestPanel = hoistCmp({
    model: creates(FetchApiTestModel),

    render({model}) {
        return hbox({
            flex: 1,
            items: [
                panel({
                    title: 'Send Request with Status Code',
                    className: 'xh-border-right',
                    width: 360,
                    margin: '0 1px 0 0',
                    flexShrink: 0,
                    tbar: [
                        box('Server:'),
                        select({
                            bind: 'testServer',
                            options: model.testServers,
                            width: 110
                        }),
                        box('Method:'),
                        select({
                            bind: 'testMethod',
                            options: model.testMethods,
                            width: 110
                        })
                    ],
                    item: tabContainer({
                        model: {
                            tabs: [
                                {
                                    id: 'groups',
                                    title: 'Code Groups',
                                    content: codeGroupBtns
                                },
                                {
                                    id: 'individual', 
                                    title: 'Individual Codes', 
                                    content: individualBtns
                                }
                            ]
                        }
                    })
                }),
                panel({
                    title: 'Response',
                    className: 'xh-border-left',
                    item: vframe({
                        item: jsonInput({
                            flex: 1,
                            width: '100%',
                            value: model.response
                        }),
                        padding: 10
                    })
                }),
                mask({
                    bind: model.loadModel,
                    spinner: true
                })
            ]
        });
    }
});

const individualBtns = hoistCmp.factory(
    ({model}) => vbox({
        style: {overflowY: 'scroll'},
        items: model.codes.map(it => hframe({
            className: 'http-status-code-frame',
            overflow: 'unset',
            items: [
                button({
                    flexGrow: 1,
                    className: 'http-status-code-button',
                    text: `${it.code}: ${it.description}`,
                    onClick: () => model.testCodeAsync(it.code),
                    minimal: false
                }),
                button({
                    icon: Icon.info(),
                    onClick: () => window.open(`${model.referenceSite}${it.code}`),
                    minimal: false
                })]
        }))
    })
);

const codeGroupBtns = hoistCmp.factory(
    ({model}) => vframe({
        style: {overflowY: 'scroll'},
        items: model.codes
            .filter(it => !(it.code % 100))
            .map(it => button({
                className: 'http-status-code-group-button',
                text: `${it.code.toString().replace(/00$/, 'XX')}: Test all ${it.code}s`,
                onClick: () => model.testCodeGroupAsync(it.code),
                minimal: false
            }))
    })
);