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
export class OLHCChart extends Component {

    render() {
        return panel({
            title: 'Prices',
            icon: Icon.gridPanel(),
            width: 600,
            height: 400,
            item: chart({
                model: this.model.olhcChartModel
            }),
            mask: this.model.loadModel
        });
    }
}
export const olhcChart = elemFactory(OLHCChart);