/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {hbox, filler, vframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';

import {PortfolioPanelModel} from './PortfolioPanelModel';
import {strategyGrid} from './StrategyGrid';
import {ordersGrid} from './OrdersGrid';
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
                    panel({
                        title: 'Positions',
                        icon: Icon.portfolio(),
                        sizingModel: model.leftSizingModel,
                        items: [
                            strategyGrid({
                                model: model.strategyGridModel
                            })
                        ],
                        bbar: toolbar(
                            dimensionChooser({model: model.dimensionChooserModel.model}),
                            filler(),
                            relativeTimestamp({timestamp: model.loadTimestamp})
                        )
                    }),
                    panel({
                        item: ordersGrid({
                            model: model.ordersGridModel
                        })
                    })
                ]
            }),
            panel({
                title: `Trading Volume + Price History: ${model.selectedOrderSymbol}`,
                icon: Icon.chartArea(),
                sizingModel: model.bottomSizingModel,
                item: hbox({
                    items: [
                        lineChart({
                            model: model.lineChartModel,
                            flex: 1,
                            className: 'xh-border-right'
                        }),
                        ohlcChart({
                            model: model.olhcChartModel,
                            flex: 1
                        })
                    ]
                })
            })
        );
    }
}