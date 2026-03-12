import {grid} from '@xh/hoist/cmp/grid';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {WebSocketTestModel} from './WebSocketTestModel';

export const WebSocketTestPanel = hoistCmp({
    model: creates(WebSocketTestModel),

    render({model}) {
        const {subscribedLocal, subscribedCluster} = model;

        return panel({
            tbar: [
                button({
                    text: 'Subscribe Local',
                    icon: Icon.playCircle(),
                    intent: 'success',
                    minimal: false,
                    omit: subscribedLocal,
                    onClick: () => model.subscribeLocalAsync()
                }),
                button({
                    text: 'Unsubscribe Local',
                    icon: Icon.stopCircle(),
                    intent: 'danger',
                    minimal: false,
                    omit: !subscribedLocal,
                    onClick: () => model.unsubscribeLocalAsync()
                }),
                button({
                    text: 'Subscribe Cluster',
                    icon: Icon.playCircle(),
                    intent: 'success',
                    minimal: false,
                    omit: subscribedCluster,
                    onClick: () => model.subscribeClusterAsync()
                }),
                button({
                    text: 'Unsubscribe Cluster',
                    icon: Icon.stopCircle(),
                    intent: 'danger',
                    minimal: false,
                    omit: !subscribedCluster,
                    onClick: () => model.unsubscribeClusterAsync()
                })
            ],
            item: grid()
        });
    }
});
