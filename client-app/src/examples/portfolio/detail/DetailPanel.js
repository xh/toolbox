import {hframe, placeholder} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import {chartsPanel} from './ChartsPanel';
import {DetailPanelModel} from './DetailPanelModel';
import {ordersPanel} from './OrdersPanel';

export const detailPanel = hoistCmp.factory({
    model: uses(DetailPanelModel),

    /** @param {DetailPanelModel} model */
    render({model}) {
        const {panelSizingModel, positionId} = model,
            {collapsed} = panelSizingModel;

        const items = positionId ?
            [ordersPanel(), chartsPanel()] :
            [placeholder('Select a position to view details.')];

        return panel({
            model: panelSizingModel,
            title: collapsed ? 'Position Details' : null,
            icon: collapsed ? Icon.detail() : null,
            item: hframe({items})
        });
    }
});
