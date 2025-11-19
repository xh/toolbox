import {img} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {webSocketIndicator} from '@xh/hoist/cmp/websocket';
import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dynamicTabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {welcomeMsg} from '../core/cmp/WelcomeMsg';
// @ts-ignore
import xhLogo from '../core/img/xh-toolbox-logo.png';
import '../core/Toolbox.scss';
import './App.scss';
import {AppModel} from './AppModel';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        return panel({
            tbar: appBar({
                icon: img({src: xhLogo, onClick: () => model.goHome()}),
                title: null,
                leftItems: [dynamicTabSwitcher()],
                rightItems: [
                    webSocketIndicator({iconOnly: true, marginRight: 4}),
                    appBarSeparator()
                ],
                hideRefreshButton: false,
                appMenuButtonProps: {
                    hideLogoutItem: false,
                    extraItems: [welcomeMsg({multiline: true})]
                }
            }),
            hotkeys: [
                {
                    label: 'Switch to the home tab',
                    combo: 'shift + h',
                    global: true,
                    onKeyDown: () => model.goHome()
                }
            ],
            item: tabContainer({
                switcher: false,
                childContainerProps: {switcher: {orientation: 'left', className: 'tb-switcher'}}
            }),
            mask: 'onLoad'
        });
    }
});
