import {hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {detailPanel} from './detail/DetailPanel';
import {gridPanel} from './GridPanel';
import {mapPanel} from './MapPanel';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {persistenceManager} from '@xh/hoist/desktop/cmp/persistenceManager';

export const portfolioPanel = hoistCmp.factory({
    model: creates(PortfolioPanelModel),

    render() {
        return panel({
            tbar: tbar(),
            mask: 'onLoad',
            items: [hframe(gridPanel(), mapPanel()), detailPanel()]
        });
    }
});

const tbar = hoistCmp.factory<PortfolioPanelModel>({
    render() {
        return toolbar({
            item: persistenceManager()
        });
    }
});
