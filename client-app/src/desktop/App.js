import {img} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {webSocketIndicator} from '@xh/hoist/cmp/websocket';
import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {welcomeMsg} from '../core/cmp/WelcomeMsg';
import xhLogo from '../core/img/xh-toolbox-logo.png';
import '../core/Toolbox.scss';
import './App.scss';
import {AppModel} from './AppModel';
import {search} from './search/Search';

export const App = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        return panel({
            tbar: appBar({
                icon: img({src: xhLogo, onClick: () => model.goHome()}),
                title: null,
                leftItems: [
                    tabSwitcher()
                ],
                rightItems: [
                    search({width: 300}),
                    webSocketIndicator({iconOnly: true, marginRight: 4}),
                    appBarSeparator()
                ],
                hideRefreshButton: false,
                appMenuButtonProps: {
                    hideLogoutItem: false,
                    extraItems: [
                        welcomeMsg({multiline: true})
                    ]
                }
            }),
            className: 'toolbox-app-frame',
            item: tabContainer()
        });
    }
});
