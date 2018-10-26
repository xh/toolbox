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
import {Icon} from '@xh/hoist/icon';
import {hbox} from '@xh/hoist/cmp/layout';
import {PortfolioPanelModel} from './PortfolioPanelModel';
import {grid} from '@xh/hoist/cmp/grid';
import {chart} from '@xh/hoist/desktop/cmp/chart';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {action} from '@xh/hoist/mobx';

@HoistComponent
export class PortfolioPanel extends Component {

    strategiesSizingModel = new PanelSizingModel({
        defaultSize: 600,
        side: 'left'
    });

    bottomSizingModel = new PanelSizingModel({
        defaultSize: 400,
        side: 'bottom'
    });

    localModel = new PortfolioPanelModel();

    render() {
        const {model} = this;

        return wrapper({
            item: panel({
                width: 1200,
                items: [
                    hbox({
                        items: [
                            panel({
                                flex: 1,
                                title: 'Strategies',
                                icon: Icon.gridPanel(),
                                sizingModel: this.strategiesSizingModel,
                                height: 300,
                                item: grid({
                                    flex: 1,
                                    model: model.strategyGridModel
                                }),
                                mask: model.portfolioLoadModel
                            }),
                            panel({
                                flex: 1,
                                title: 'Orders',
                                icon: Icon.gridPanel(),
                                height: 300,
                                item: grid({
                                    flex: 1,
                                    model: model.ordersGridModel
                                }),
                                mask: model.ordersLoadModel
                            }),
                            dimensionChooser({
                                model: model,
                                field: 'dimensions',
                                dimensions: [
                                    {value: 'model', label: 'Model'},
                                    {value: 'strategy', label: 'Strategy'},
                                    {value: 'symbol', label: 'Symbol'}]
                            })
                        ]
                    }),
                    panel({
                        sizingModel: this.bottomSizingModel,
                        item: hbox({
                            items: [
                                panel({
                                    title: 'Trade Volume',
                                    icon: Icon.gridPanel(),
                                    width: 600,
                                    height: 400,
                                    item: chart({
                                        model: model.lineChartModel
                                    }),
                                    mask: model.lineChartLoadModel
                                }),
                                panel({
                                    title: 'Prices',
                                    icon: Icon.gridPanel(),
                                    width: 600,
                                    height: 400,
                                    item: chart({
                                        model: model.olhcChartModel
                                    }),
                                    mask: model.olhcChartLoadModel
                                })
                            ]
                        })
                    })
                ]
            })
        });
    }
}