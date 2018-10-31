/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {wrapper} from '../../../common/index';
import {panel, PanelSizingModel} from '@xh/hoist/desktop/cmp/panel';
import {hbox} from '@xh/hoist/cmp/layout';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {strategyGrid} from './StrategyGrid';
import {ordersGrid} from './OrdersGrid';
import {lineChart} from './LineChart';
import {olhcChart} from './OLHCChart';
import { dimensionChooser } from '@xh/hoist/desktop/cmp/dimensionchooser/DimensionChooser';
import { toolbar } from '@xh/hoist/desktop/cmp/toolbar';

@HoistComponent
export class PortfolioPanel extends Component {

    bottomSizingModel = new PanelSizingModel({
        defaultSize: 400,
        side: 'bottom'
    });

    localModel = new PortfolioPanelModel();

    render() {
        return wrapper({
            item: panel({
                width: 1200,
                height: 1000,
                tbar: toolbar(dimensionChooser({
                    model: this.localModel.dimensionChooserModel.model
                })),
                items: [
                    hbox({
                        items: [
                            strategyGrid({
                                model: this.localModel.strategyGridModel
                            }),
                            ordersGrid({
                                model: this.localModel.ordersGridModel
                            })
                        ]
                    }),
                    panel({
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