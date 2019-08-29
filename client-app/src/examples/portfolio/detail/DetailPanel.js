import {hoistElemFactory} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hbox} from '@xh/hoist/cmp/layout';
import {ordersPanel} from './OrdersPanel';
import {chartsPanel} from './ChartsPanel';

export const detailPanel = hoistElemFactory(
    ({model}) => panel({
        model: model.panelSizingModel,
        mask: !model.positionId,
        item: hbox({
            flex: 1,
            items: [
                ordersPanel({model: model.ordersPanelModel}),
                chartsPanel({model: model.chartsPanelModel})
            ]
        })
    })
);