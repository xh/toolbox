import {hoistCmp} from '@xh/hoist/core';
import {box} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';

export const panelWidget = hoistCmp.factory({
    render() {
        return panel(
            box({
                padding: 10,
                item: 'Just a simple panel'
            })
        );
    }
});