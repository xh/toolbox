import {img} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {webSocketIndicator} from '@xh/hoist/cmp/websocket';
import {hoistCmp, HoistUser, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {themeToggleButton} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dynamicTabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {profilePic, welcomeMsg} from '../core/cmp';
// @ts-ignore
import xhLogo from '../core/img/xh-toolbox-logo.png';
import '../core/Toolbox.scss';
import './App.scss';
import {AppModel} from './AppModel';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        const renderWithUserProfile = model.renderWithUserProfile
            ? (user: HoistUser) => profilePic({user})
            : false;

        return panel({
            tbar: appBar({
                icon: img({src: xhLogo, onClick: () => model.goHome()}),
                title: null,
                leftItems: [dynamicTabSwitcher({testId: 'top-level-tabs'})],
                rightItems: [
                    webSocketIndicator({iconOnly: true, marginRight: 4}),
                    appBarSeparator(),
                    themeToggleButton()
                ],
                hideRefreshButton: false,
                appMenuButtonProps: {
                    renderWithUserProfile,
                    hideLogoutItem: false,
                    // Theme toggle is exposed directly in the AppBar above, so hide the duplicate
                    // app-menu entry (the modal Options dialog still offers theme + "system" sync).
                    hideThemeItem: true,
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
