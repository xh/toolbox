/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {chart} from '@xh/hoist/desktop/cmp/chart';

@HoistComponent
export class LineChart extends Component {

    render() {
        return panel({
            title: 'Volume',
            icon: Icon.gridPanel(),
            width: 600,
            item: chart({
                model: this.model.lineChartModel
            }),
            mask: this.model.loadModel
        });
    }
}
export const lineChart = elemFactory(LineChart);