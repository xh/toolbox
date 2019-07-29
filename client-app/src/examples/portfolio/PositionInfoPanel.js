import {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core';
import {PositionInfoPanelModel} from './PositionInfoPanelModel';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hbox} from '@xh/hoist/cmp/layout';
import {ordersPanel} from './OrdersPanel';
import {chartsPanel} from './ChartsPanel';

@HoistComponent
export class PositionInfoPanel extends Component {

    model = new PositionInfoPanelModel();

    render() {
        const {model} = this,
            {ordersPanelModel, chartsPanelModel} = model;

        return panel({
            model: {
                defaultSize: 400,
                side: 'bottom',
                collapsedRenderMode: 'unmountOnHide'
            },
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