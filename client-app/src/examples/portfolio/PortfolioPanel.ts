import {hframe, placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {detailPanel} from './detail/DetailPanel';
import {gridPanel} from './GridPanel';
import {mapPanel} from './MapPanel';
import {PortfolioPanelModel} from './PortfolioPanelModel';

export const portfolioPanel = hoistCmp.factory<PortfolioPanelModel>({
    model: creates(PortfolioPanelModel),

    render({model}) {
        return panel({
            mask: [model.loadModel, model.initTask],
            items: model.persistenceManagerModel
                ? [hframe(gridPanel(), mapPanel()), detailPanel()]
                : placeholder()
        });
    }
});
