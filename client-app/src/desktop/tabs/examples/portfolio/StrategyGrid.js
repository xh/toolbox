/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core/index';
import {panel, PanelSizingModel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {grid} from '@xh/hoist/cmp/grid';

@HoistComponent
export class StrategyGrid extends Component {

    strategiesSizingModel = new PanelSizingModel({
        defaultSize: 600,
        side: 'left'
    });
    render() {
        return panel({
            flex: 1,
            title: 'Strategies',
            icon: Icon.gridPanel(),
            sizingModel: this.strategiesSizingModel,
            height: 300,
            item: grid({
                flex: 1,
                model: this.model.gridModel
            }),
            mask: this.model.loadModel,
            // tbar: toolbar({
            //     items: [
            //         dimensionChooser({
            //             model: this.portfolioPanelModel,
            //             field: 'dimensions',
            //             dimensions: [
            //                 {value: 'model', label: 'Model'},
            //                 {value: 'strategy', label: 'Strategy'},
            //                 {value: 'symbol', label: 'Symbol'}]
            //         })
            //     ]
            // })
        });
    }
}
export const strategyGrid = elemFactory(StrategyGrid);