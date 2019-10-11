import {hoistCmp, creates} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, hbox, p, vbox, hframe, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {select, jsonInput} from '@xh/hoist/desktop/cmp/input';

import {FetchApiTestModel} from './FetchApiTestModel';

import './FetchApiTestStyles.scss';


export const FetchApiTestPanel = hoistCmp({
    model: creates(FetchApiTestModel),

    render({model}) {
        return panel({
            title: 'Fetch API Tester',
            icon: Icon.rocket(),
            items: [
                vbox({
                    padding: '10px 10px 10px 10px',
                    items: [
                        p('Test if FetchService correctly handles a response with a particular status code.'),
                        p('Click on a status code button in the left panel to make a request that will respond with that status code.'),
                        p('The response ouput from that request will display in the right hand panel.')
                    ]
                }),
                hbox({
                    flex: 1,
                    items: [
                        panel({
                            title: 'Send Request with Status Code',
                            className: 'xh-border-right',
                            width: 350,
                            margin: '0 1px 0 0',
                            flexShrink: 0,
                            tbar: [
                                box('Svr:'),
                                select({
                                    bind: 'testServer',
                                    options: model.testServers,
                                    width: 160
                                }),
                                box('Mth:'),
                                select({
                                    bind: 'testMethod',
                                    options: model.testMethods,
                                    width: 110
                                })
                            ],
                            item: vbox({
                                style: {overflowY: 'scroll'},
                                items: model.codes.map(it => hframe({
                                    className: 'http-status-code-frame',
                                    overflow: 'unset',
                                    items: [
                                        button({
                                            flexGrow: 1,
                                            className: 'http-status-code-button',
                                            text: `${it.code}: ${it.description}`,
                                            onClick: () => model.requestCodeAsync(it.code),
                                            minimal: false
                                        }),
                                        button({
                                            icon: Icon.info(),
                                            onClick: () => window.open(`${model.referenceSite}${it.code}`),
                                            minimal: false
                                        })]
                                }))
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
                        })
                    ]
                })
            ]
        });
    }
});