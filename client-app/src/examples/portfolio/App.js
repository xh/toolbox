import {webSocketIndicator} from '@xh/hoist/cmp/websocket';
import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {ContextMenuItem as CM} from '@xh/hoist/desktop/cmp/contextmenu';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {portfolioPanel} from './PortfolioPanel';
import '../../core/Toolbox.scss';

export const App = hoistCmp.factory({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            contextMenu: [CM.reloadApp(), CM.about(), CM.logout()],
            tbar: appBar({
                appMenuButtonProps: {
                    icon: Icon.portfolio(),
                    minimal: false
                },
                appMenuButtonPosition: 'left',
                rightItems: [
                    webSocketIndicator({iconOnly: true, marginRight: 4}),
                    appBarSeparator()
                ]
            }),
            item: portfolioPanel()
        });
    }
});
