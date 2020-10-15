import {br, div, img} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {webSocketIndicator} from '@xh/hoist/cmp/websocket';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import xhLogo from '../core/img/xh-toolbox-logo.png';
import '../core/Toolbox.scss';
import './App.scss';
import {AppModel} from './AppModel';

export const App = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        const user = XH.getUser();

        return panel({
            tbar: appBar({
                icon: img({src: xhLogo, onClick: () => model.goHome()}),
                title: null,
                leftItems: [
                    tabSwitcher()
                ],
                rightItems: [
                    webSocketIndicator({iconOnly: true, marginRight: 4}),
                    appBarSeparator()
                ],
                hideRefreshButton: false,
                appMenuButtonProps: {
                    hideLogoutItem: false,
                    extraItems: [
                        div({
                            className: 'tb-welcome-message',
                            items: [
                                div({
                                    className: 'tb-welcome-message__profile-pic',
                                    item: img({src: user.profilePicUrl}),
                                    omit: !user.profilePicUrl
                                }),
                                `Welcome,`, br(), user.displayName
                            ]
                        })
                    ]
                }
            }),
            className: 'toolbox-app-frame',
            item: tabContainer()
        });
    }
});
