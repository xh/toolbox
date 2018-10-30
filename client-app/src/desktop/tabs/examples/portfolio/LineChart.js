/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {chart} from '@xh/hoist/desktop/cmp/chart';

@HoistComponent
export class LineChart extends Component {

    localModel = this.props.children.lineChartModel;

    render() {
        return panel({
            title: 'Prices',
            icon: Icon.gridPanel(),
            width: 600,
            height: 400,
            item: chart({
                model: this.localModel.lineChartModel
            }),
            mask: this.localModel.localModel
        });
    }
}
export const lineChart = elemFactory(LineChart);