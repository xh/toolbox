import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {ContextMenuItem as CM} from '@xh/hoist/desktop/cmp/contextmenu';
import {webSocketIndicator} from '@xh/hoist/cmp/websocket';

import {portfolioPanel} from './PortfolioPanel';
import {AppModel} from '../../AppModel';

export const app = hoistCmp.factory({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            contextMenu: [CM.reloadApp(), CM.about(), CM.logout()],
            tbar: appBar({
                icon: Icon.portfolio({size: '2x', prefix: 'fal'}),
                title: 'Portfolio',
                rightItems: [
                    Icon.factory({
                        title: 'Components rendered via Hoist element factories (no JSX)',
                        style: {cursor: 'help'}
                    }),
                    webSocketIndicator({iconOnly: true, marginRight: 4}),
                    appBarSeparator()
                ],
                hideRefreshButton: false
            }),
            item: portfolioPanel()
        });
    }
});
