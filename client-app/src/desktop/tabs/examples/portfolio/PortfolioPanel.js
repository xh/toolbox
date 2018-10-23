/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {wrapper} from '../../../common/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {hbox} from '@xh/hoist/cmp/layout';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {grid} from '@xh/hoist/cmp/grid';
import {chart} from '@xh/hoist/desktop/cmp/chart';

@HoistComponent
export class PortfolioPanel extends Component {

    localModel = new PortfolioPanelModel();

    render() {
        const {model} = this;

        return wrapper({
            item: panel({
                width: 1000,
                items: [
                    hbox({
                        flex: 1,
                        items: [
                            panel({
                                title: 'Strategies',
                                icon: Icon.gridPanel(),
                                width: 600,
                                height: 300,
                                item: grid({model: model.strategyGridModel}),
                                mask: model.portfolioLoadModel
                            }),
                            panel({
                                title: 'Orders',
                                icon: Icon.gridPanel(),
                                width: 500,
                                height: 300,
                                item: grid({model: model.ordersGridModel}),
                                mask: model.ordersLoadModel
                            })
                        ]
                    }),
                    hbox({
                        flex: 1,
                        items: [
                            panel({
                                title: 'Trade Volume',
                                icon: Icon.gridPanel(),
                                width: 750,
                                height: 400,
                                item: chart({model: model.lineChartModel}),
                                mask: model.lineChartLoadModel
                            }),
                            panel({
                                title: 'Prices',
                                icon: Icon.gridPanel(),
                                width: 750,
                                height: 400,
                                item: chart({model: model.olhcChartModel}),
                                mask: model.olhcChartLoadModel
                            })
                        ]
                    })
                ]
            })
        });
    }
}