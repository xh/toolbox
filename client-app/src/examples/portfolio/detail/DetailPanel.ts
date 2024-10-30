import {hframe, placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import {chartsPanel} from './charts/ChartsPanel';
import {DetailModel} from './DetailModel';
import {ordersGrid} from './orders/OrdersGrid';

export const detailPanel = hoistCmp.factory({
    model: creates(DetailModel),

    render({model}) {
        const {panelModel, positionId} = model;

        return panel({
            model: panelModel,
            collapsedTitle: 'Position Details',
            collapsedIcon: Icon.detail(),
            item: positionId
                ? hframe([ordersGrid(), chartsPanel()])
                : placeholder('Select a position to view details.')
        });
    }
});
