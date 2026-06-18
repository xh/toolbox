import {hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {detailPanel} from './detail/DetailPanel';
import {positionsGrid} from './grid/PositionsGrid';
import {positionsMap} from './map/PositionsMap';
import {PortfolioModel} from './PortfolioModel';

export const portfolioPanel = hoistCmp.factory({
    model: creates(PortfolioModel),

    render() {
        return panel({
            items: [hframe(positionsGrid(), positionsMap()), detailPanel()],
            mask: 'onLoad'
        });
    }
});
