/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, LayoutSupport} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {chart} from '@xh/hoist/desktop/cmp/chart';

@HoistComponent
@LayoutSupport
export class OHLCChart extends Component {

    render() {
        const {olhcChartModel, loadModel} = this.model;

        return panel({
            item: chart({model: olhcChartModel}),
            mask: loadModel,
            className: this.getClassName(),
            ...this.getLayoutProps()
        });
    }
}
export const ohlcChart = elemFactory(OHLCChart);