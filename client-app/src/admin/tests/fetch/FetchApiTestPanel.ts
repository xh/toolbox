import {creates, hoistCmp} from '@xh/hoist/core';
import {box, hbox, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {jsonInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
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
                    width: 425,
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
                        }),
                        switchInput({
                            bind: 'testCorrelationIds',
                            label: 'CIDs'
                        })
                    ],
                    item: tabContainer()
                }),
                panel({
                    title: 'Outcome',
                    className: 'xh-border-left',
                    item: vframe({
                        item: jsonInput({
                            flex: 1,
                            width: '100%',
                            value: model.outcome
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
