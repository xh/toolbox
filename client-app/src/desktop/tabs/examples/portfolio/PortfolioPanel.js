/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {hbox, hframe, vframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {positionsPanel} from './PositionsPanel';
import {ordersPanel} from './OrdersPanel';
import {lineChart} from './LineChart';
import {ohlcChart} from './OHLCChart';

import './PortfolioPanel.scss';

@HoistComponent
export class PortfolioPanel extends Component {

    model = new PortfolioPanelModel();

    render() {
        const {model} = this;

        return vframe(
            hbox({
                flex: 1,
                items: [
                    positionsPanel({
                        model: model.positionsPanelModel
                    }),
                    ordersPanel({
                        model: model.ordersPanelModel
                    })
                ]
            }),
            panel({
                title: `Trading Volume + Price History: ${model.displayedOrderSymbol}`,
                icon: Icon.chartArea(),
                compactHeader: true,
                mask: !model.selectedOrder,
                model: {
                    defaultSize: 400,
                    side: 'bottom',
                    collapsedRenderMode: 'unmountOnHide'
                },
                item: hframe({
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