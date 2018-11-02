/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {grid} from '@xh/hoist/cmp/grid';

@HoistComponent
export class StrategyGrid extends Component {

    render() {
        return panel({
            flex: 1,
            item: grid({
                flex: 1,
                model: this.model.gridModel
            }),
            mask: this.model.loadModel
        });
    }
}
export const strategyGrid = elemFactory(StrategyGrid);