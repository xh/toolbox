import {webSocketIndicator} from '@xh/hoist/cmp/websocket';
import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import {welcomeMsg} from '../../core/cmp/WelcomeMsg';
import {AppModel} from './AppModel';
import {portfolioPanel} from './PortfolioPanel';
import '../../core/Toolbox.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            tbar: appBar({
                appMenuButtonProps: {
                    icon: Icon.portfolio(),
                    minimal: false,
                    hideLogoutItem: false
                },
                appMenuButtonPosition: 'left',
                leftItems: [viewManager()],
                rightItems: [
                    welcomeMsg(),
                    appBarSeparator(),
                    webSocketIndicator(),
                    appBarSeparator()
                ]
            }),
            item: portfolioPanel()
        });
    }
});
