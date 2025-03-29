import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar} from '@xh/hoist/mobile/cmp/header';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {navigator} from '@xh/hoist/mobile/cmp/navigator';
import '../../../core/Toolbox.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            tbar: appBar({
                icon: Icon.contact({size: '2x', prefix: 'fal'}),
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            item: navigator()
        });
    }
});
