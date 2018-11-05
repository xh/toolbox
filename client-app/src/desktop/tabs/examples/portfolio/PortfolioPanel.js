/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {hbox, vframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {positionsPanel} from './PositionsPanel';
import {ordersPanel} from './OrdersPanel';
import {lineChart} from './LineChart';
import {ohlcChart} from './OHLCChart';

@HoistComponent
export class PortfolioPanel extends Component {

    localModel = new PortfolioPanelModel();

    render() {
        const {model} = this;

        return vframe(
            hbox({
                flex: 1,
                items: [
                    positionsPanel({model: model.positionsPanelModel}),
                    ordersPanel({model: model.ordersPanelModel})
                ]
            }),
            panel({
                title: `Trading Volume + Price History: ${model.selectedOrderSymbol}`,
                icon: Icon.chartArea(),
                mask: !model.selectedOrder,
                sizingModel: model.chartsSizingModel,
                item: hbox({
                    items: [
                        lineChart({
                            model: model.lineChartModel,
                            flex: 1,
                            className: 'xh-border-right'
                        }),
                        ohlcChart({
                            model: model.ohlcChartModel,
                            flex: 1
                        })
                    ]
                })
            })
        );
    }
}