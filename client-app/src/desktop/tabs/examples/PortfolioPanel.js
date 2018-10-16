/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {wrapper} from '../../common';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {strategyGrid} from './PortfolioStrategyGrid';
import {ordersGrid} from './PortfolioOrdersGrid';
import {hbox} from '@xh/hoist/cmp/layout';
import {PortfolioDataGenerator} from './PortfolioDataGenerator';
import {portfolioLineChartPanel} from './PortfolioLineChartPanel';
import {portfolioOLHCChartPanel} from "./PortfolioOLHCChartPanel";

@HoistComponent
export class PortfolioPanel extends Component {

    portfolioData = new PortfolioDataGenerator();

    render() {
        return wrapper({
            item: panel({
                title: 'Positions',
                icon: Icon.window(),
                width: 1500,
                items: [
                    hbox({
                        flex: 1,
                        items: [
                            panel({
                                title: 'Strategies',
                                icon: Icon.gridPanel(),
                                width: 600,
                                height: 300,
                                item: strategyGrid(this.portfolioData)
                            }),
                            panel({
                                title: 'Orders',
                                icon: Icon.gridPanel(),
                                width: 900,
                                height: 300,
                                item: ordersGrid(this.portfolioData)
                            })
                        ]
                    }),
                    hbox({
                        flex: 1,
                        items: [
                            panel({
                                title: 'Strategies',
                                icon: Icon.gridPanel(),
                                width: 750,
                                height: 400,
                                item: portfolioLineChartPanel(this.portfolioData)
                            }),
                            panel({
                                title: 'Orders',
                                icon: Icon.gridPanel(),
                                width: 750,
                                height: 400,
                                item: portfolioOLHCChartPanel(this.portfolioData)
                            })
                        ]
                    })
                ]
            })
        });
    }
}