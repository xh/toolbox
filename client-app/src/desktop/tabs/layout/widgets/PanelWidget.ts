import {hoistCmp} from '@xh/hoist/core';
import {placeholder, p} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';

export const panelWidget = hoistCmp.factory({
    render() {
        return panel({
            item: placeholder(Icon.window(), p('Just a simple panel.'))
        });
    }
});
