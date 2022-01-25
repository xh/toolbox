import {hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {gridPanel} from '../../../examples/portfolio/GridPanel';
import {mapPanel} from '../../../examples/portfolio/MapPanel';
import {PortfolioPanelModel} from '../../../examples/portfolio/PortfolioPanelModel';
import {detailPanel} from '../../../examples/portfolio/detail/DetailPanel';
import {welcomeMsg} from '../../../core/cmp/WelcomeMsg';
import {webSocketIndicator} from '@xh/hoist/cmp/websocket';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {Icon} from '@xh/hoist/icon';

export const portfolioPanel = hoistCmp.factory({
    model: creates(PortfolioPanelModel),

    render() {
        return panel({
            mask: 'onLoad',
            tbar: appBar({
                title: 'XH Portfolio',
                icon: Icon.portfolio({size: '2x'}),
                hideAppMenuButton: true,
                hideWhatsNewButton: true,
                rightItems: [
                    welcomeMsg(),
                    appBarSeparator(),
                    webSocketIndicator(),
                    appBarSeparator()
                ]
            }),
            items: [
                hframe(gridPanel(), mapPanel()),
                detailPanel()
            ]
        });
    }
});
