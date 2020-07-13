import {img} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {webSocketIndicator} from '@xh/hoist/cmp/websocket';
import {tabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {AppModel} from './AppModel';
import xhLogo from '../core/img/xh-toolbox-logo.png';
import '../core/Toolbox.scss';
import './App.scss';

export const App = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            contextMenu: null,
            tbar: appBar({
                icon: img({src: xhLogo}),
                title: null,
                leftItems: [
                    tabSwitcher()
                ],
                rightItems: [
                    webSocketIndicator({iconOnly: true, marginRight: 4}),
                    appBarSeparator()
                ],
                hideRefreshButton: false
            }),
            className: 'toolbox-app-frame',
            item: tabContainer()
        });
    }
});