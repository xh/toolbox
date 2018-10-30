/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {wrapper} from '../../../common/index';
import {panel, PanelSizingModel} from '@xh/hoist/desktop/cmp/panel';
import {hbox} from '@xh/hoist/cmp/layout';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {strategyGrid} from './StrategyGrid';
import {ordersGrid} from './OrdersGrid';
import {lineChart} from './LineChart';
import {olhcChart} from './OLHCChart';

@HoistComponent
export class PortfolioPanel extends Component {

    bottomSizingModel = new PanelSizingModel({
        defaultSize: 400,
        side: 'bottom'
    });

    localModel = new PortfolioPanelModel();

    render() {
        // const {model} = this;

        return wrapper({
            item: panel({
                width: 1200,
                items: [
                    hbox({
                        items: [
                            strategyGrid(this.localModel),
                            ordersGrid(this.localModel)
                        ]
                    }),
                    panel({
                        sizingModel: this.bottomSizingModel,
                        item: hbox({
                            items: [
                                lineChart(this.localModel),
                                olhcChart(this.localModel)
                            ]
                        })
                    })
                ]
            })
        });
    }
}