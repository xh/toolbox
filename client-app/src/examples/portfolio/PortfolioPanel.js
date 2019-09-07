import {hoistElemFactory, localModel} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hbox, vframe} from '@xh/hoist/cmp/layout';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {gridPanel} from './GridPanel';
import {detailPanel} from './detail/DetailPanel';
import {mapPanel} from './MapPanel';

import './PortfolioPanel.scss';

export const portfolioPanel = hoistElemFactory({
    model: localModel(PortfolioPanelModel),

    render({model}) {
        return panel({
            mask: model.loadModel,
            item: vframe(
                hbox({
                    flex: 1,
                    items: [
                        gridPanel({model: model.gridPanelModel}),
                        mapPanel({model: model.mapPanelModel})
                    ]
                }),
                detailPanel()
            )
        });
    }
});