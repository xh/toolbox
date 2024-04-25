import {hframe, placeholder} from '@xh/hoist/cmp/layout';
import {hoistCmp, creates} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import {chartsPanel} from './charts/ChartsPanel';
import {DetailPanelModel} from './DetailPanelModel';
import {ordersPanel} from './OrdersPanel';

export const detailPanel = hoistCmp.factory({
    model: creates(DetailPanelModel),

    render({model}) {
        const {panelSizingModel, positionId} = model;

        const items = positionId
            ? [ordersPanel(), chartsPanel()]
            : [placeholder('Select a position to view details.')];

        return panel({
            model: panelSizingModel,
            collapsedTitle: 'Position Details',
            collapsedIcon: Icon.detail(),
            item: hframe(items)
        });
    }
});
