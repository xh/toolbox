import {hoistCmp, useContextModel} from '@xh/hoist/core';
import {button} from '@xh/hoist/mobile/cmp/button';
import {buttonGroupInput} from '@xh/hoist/mobile/cmp/input';
import {withDefault} from '@xh/hoist/utils/js';

export const storeFilterFieldMatchModeButton = hoistCmp.factory(
    ({model}) => {
        model = withDefault(model, useContextModel());

        return buttonGroupInput({
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
        });
    }
);
