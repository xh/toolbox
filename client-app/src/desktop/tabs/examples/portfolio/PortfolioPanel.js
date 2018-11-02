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
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser/DimensionChooser';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';

@HoistComponent
export class PortfolioPanel extends Component {

    leftSizingModel = new PanelSizingModel({
        defaultSize: 600,
        side: 'left'
    });

    bottomSizingModel = new PanelSizingModel({
        defaultSize: 400,
        side: 'bottom'
    });

    localModel = new PortfolioPanelModel();

    render() {
        return wrapper({
            description: [
                <p>
                    This example demonstrates the reactive features of the Hoist framework, and the ability to connect multiple components through a common model.
                </p>
            ],
            item: panel({
                width: 1200,
                height: 1000,
                items: [
                    hbox({
                        flex: 1,
                        items: [
                            panel({
                                title: 'Strategies',
                                icon: Icon.gridPanel(),
                                sizingModel: this.leftSizingModel,
                                tbar: toolbar(dimensionChooser({
                                    model: this.localModel.dimensionChooserModel.model
                                })),
                                item: strategyGrid({
                                    model: this.localModel.strategyGridModel
                                })
                            }),
                            panel({
                                item: ordersGrid({
                                    model: this.localModel.ordersGridModel
                                })
                            })
                        ]
                    }),
                    panel({
                        flex: 1,
                        sizingModel: this.bottomSizingModel,
                        item: hbox({
                            items: [
                                lineChart({
                                    model: this.localModel.lineChartModel
                                }),
                                olhcChart({
                                    model: this.localModel.olhcChartModel
                                })
                            ]
                        })
                    })
                ]
            })
        });
    }
}