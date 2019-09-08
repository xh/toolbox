import {hoistCmpFactory, providedAndPublished} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hbox} from '@xh/hoist/cmp/layout';
import {ordersPanel} from './OrdersPanel';
import {chartsPanel} from './ChartsPanel';
import {DetailPanelModel} from './DetailPanelModel';

export const detailPanel= hoistCmpFactory({

    model: providedAndPublished(DetailPanelModel),
                          
    render({model}) {
        return panel({
            model: model.panelSizingModel,
            mask: !model.positionId,
            item: hbox({
                flex: 1,
                items: [
                    ordersPanel(),
                    chartsPanel()
                ]
            })
        });
    }
});