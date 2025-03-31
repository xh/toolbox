import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {appBar} from '@xh/hoist/mobile/cmp/header';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import AppModel from './AppModel';
import {navigator} from '@xh/hoist/mobile/cmp/navigator';
import '../../../core/Toolbox.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            tbar: appBar({
                omit: XH.isLandscape,
                icon: Icon.boxFull({size: 'lg', prefix: 'fal'}),
                hideRefreshButton: false,
                appMenuButtonProps: {
                    hideLogoutItem: false,
                    hideThemeItem: true
                }
            }),
            item: navigator()
        });
    }
});
