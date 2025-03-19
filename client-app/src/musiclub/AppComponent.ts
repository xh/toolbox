import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {appBar} from '@xh/hoist/mobile/cmp/header';
import {navigator} from '@xh/hoist/mobile/cmp/navigator';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {AppModel} from './AppModel';
import './App.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            tbar: appBar({
                omit: XH.isLandscape,
                icon: Icon.icon({iconName: 'turntable', size: 'lg', prefix: 'fal'}),
                hideRefreshButton: true,
                appMenuButtonProps: {
                    hideFeedbackItem: true
                }
            }),
            item: navigator()
        });
    }
});
