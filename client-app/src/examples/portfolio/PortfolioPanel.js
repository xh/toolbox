import {hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {detailPanel} from './detail/DetailPanel';
import {gridPanel} from './GridPanel';
import {mapPanel} from './MapPanel';
import {PortfolioPanelModel} from './PortfolioPanelModel';

export const portfolioPanel = hoistCmp.factory({
    model: creates(PortfolioPanelModel),

    render() {
        return panel({
            mask: 'onLoad',
            items: [
                hframe(gridPanel(), mapPanel()),
                detailPanel()
            ]
        });
    }
});
