/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core/index';
import {hbox, vframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {positionsPanel} from './PositionsPanel';
import {ordersPanel} from './OrdersPanel';
import {lineChart} from './LineChart';
import {ohlcChart} from './OHLCChart';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {splitTreeMap} from '@xh/hoist/desktop/cmp/treemap';

import './PortfolioPanel.scss';
import {fmtMillions} from '@xh/hoist/format';

@HoistComponent
export class PortfolioPanel extends Component {

    model = new PortfolioPanelModel();

    render() {
        const {model} = this,
            {positionsPanelModel, splitTreeMapModel, ordersPanelModel, lineChartModel, ohlcChartModel} = model;

        return vframe(
            hbox({
                flex: 1,
                items: [
                    positionsPanel({
                        model: positionsPanelModel
                    }),
                    splitTreeMap({
                        model: splitTreeMapModel,
                        titleRenderer: (v, side) => {
                            return [
                                side === 'positive' ? 'Profit' : 'Loss',
                                fmtMillions(v, {
                                    prefix: ': $',
                                    precision: 2,
                                    label: true,
                                    asElement: true
                                })
                            ];
                        }
                    })
                ]
            }),
            panel({
                model: {
                    defaultSize: 400,
                    side: 'bottom',
                    collapsedRenderMode: 'unmountOnHide'
                },
                mask: !model.selectedOrder,
                item: hbox({
                    flex: 1,
                    items: [
                        ordersPanel({
                            model: ordersPanelModel
                        }),
                        panel({
                            title: `Charts: ${model.displayedOrderSymbol}`,
                            icon: Icon.chartArea(),
                            mask: !model.selectedOrder,
                            model: {
                                defaultSize: 700,
                                side: 'right',
                                collapsedRenderMode: 'unmountOnHide'
                            },
                            item: tabContainer({
                                model: {
                                    tabs: [
                                        {
                                            id: 'line',
                                            title: 'Trading Volume',
                                            content: () => lineChart({
                                                model: lineChartModel,
                                                flex: 1,
                                                className: 'xh-border-right'
                                            })
                                        },
                                        {
                                            id: 'ohlc',
                                            title: 'Price History',
                                            content: () => ohlcChart({
                                                model: ohlcChartModel,
                                                flex: 1
                                            })
                                        }
                                    ]
                                }
                            })
                        })
                    ]
                })
            })
        );
    }
}

export const portfolioPanel = elemFactory(PortfolioPanel);