import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hbox} from '@xh/hoist/cmp/layout';
import {gridPanel} from './GridPanel';
import {detailPanel} from './detail/DetailPanel';
import {mapPanel} from './MapPanel';
import './PortfolioPanel.scss';
import {PortfolioPanelModel} from './PortfolioPanelModel';

export const portfolioPanel = hoistCmp.factory({
    model: creates(PortfolioPanelModel),

    render() {
        return panel({
            mask: 'onLoad',
            items: [
                hbox({
                    flex: 1,
                    items: [
                        gridPanel(),
                        mapPanel()
                    ]
                }),
                detailPanel()
            ]
        });
    }
});
