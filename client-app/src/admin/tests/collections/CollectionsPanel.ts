import {creates, hoistCmp} from '@xh/hoist/core';
import {CollectionsModel} from './CollectionsModel';
import {numberInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {div, span, vframe} from '@xh/hoist/cmp/layout';

export const collectionsPanel = hoistCmp.factory({
    model: creates(CollectionsModel),
    render({model}) {
        return panel({
            tbar: [
                span('Count: '),
                numberInput({bind: 'count', displayWithCommas: true, width: 100}),
                button({
                    text: 'Test',
                    onClick: () => model.test(),
                    outlined: true
                })
            ],
            items: [
                vframe({
                    items: [
                        div(`Set Performance: ${model.setTime}ms`),
                        div(`Array Performance: ${model.arrTime}ms`),
                        div(`Map Performance: ${model.mapTime}ms`),
                        div(`Object Performance: ${model.objTime}ms`)
                    ],
                    padding: 10
                })
            ]
        });
    }
});
