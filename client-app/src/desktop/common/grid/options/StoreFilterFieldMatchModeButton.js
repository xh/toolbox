import {fragment, label, vspacer} from '@xh/hoist/cmp/layout';
import {hoistCmp, useContextModel} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {withDefault} from '@xh/hoist/utils/js';

export const storeFilterFieldMatchModeButton = hoistCmp.factory(
    ({model}) => {
        model = withDefault(model, useContextModel());

        return fragment({
            items: [
                vspacer(10),
                label('Quick filter matchMode'),
                buttonGroupInput({
                    margin: 'auto',
                    model,
                    bind: 'matchMode',
                    items: [
                        button({
                            text: 'start',
                            value: 'start'
                        }),
                        button({
                            text: 'startWord',
                            value: 'startWord'
                        }),
                        button({
                            text: 'any',
                            value: 'any'
                        })
                    ]
                })
            ]
        });
    }
);
