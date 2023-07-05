import {grid} from '@xh/hoist/cmp/grid';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {WebSocketTestModel} from './WebSocketTestModel';

export const WebSocketTestPanel = hoistCmp({
    model: creates(WebSocketTestModel),

    render({model}) {
        const {subscribed} = model;

        return panel({
            tbar: [
                button({
                    text: 'Subscribe',
                    icon: Icon.playCircle(),
                    intent: 'success',
                    minimal: false,
                    omit: subscribed,
                    onClick: () => model.subscribeAsync()
                }),
                button({
                    text: 'Unsubscribe',
                    icon: Icon.stopCircle(),
                    intent: 'danger',
                    minimal: false,
                    omit: !subscribed,
                    onClick: () => model.unsubscribeAsync()
                })
            ],
            item: grid()
        });
    }
});
