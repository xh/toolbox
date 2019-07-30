import {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hbox} from '@xh/hoist/cmp/layout';
import {ordersPanel} from './OrdersPanel';
import {chartsPanel} from './ChartsPanel';

@HoistComponent
export class PositionInfoPanel extends Component {

    render() {
        const {model} = this,
            {ordersPanelModel, chartsPanelModel} = model;

        return panel({
            model: model.panelSizingModel,
            mask: !model.positionId,
            item: hbox({
                flex: 1,
                items: [
                    ordersPanel({
                        model: ordersPanelModel
                    }),
                    chartsPanel({
                        model: chartsPanelModel
                    })
                ]
            })
        });
    }
}

export const positionInfoPanel = elemFactory(PositionInfoPanel);