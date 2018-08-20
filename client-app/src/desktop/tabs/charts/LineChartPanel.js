/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common/Wrapper';
import {vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {comboField, label} from '@xh/hoist/desktop/cmp/form';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {chart} from '@xh/hoist/desktop/cmp/chart';
import {LineChartModel} from './LineChartModel';

@HoistComponent()
export class LineChartPanel extends Component {
    localModel = new LineChartModel();

    render() {
        const model = this.model,
            {companyMap} = model;
        return wrapper(
            panel({
                className: 'toolbox-linechart-panel',
                title: 'Line Chart',
                width: 800,
                height: 600,
                item: this.renderExample(),
                tbar: toolbar(
                    label('Company: '),
                    comboField({
                        model,
                        options: Object.keys(companyMap),
                        field: 'currentCompany'
                    }),
                )
            })
        );
    }

    renderExample() {
        return vframe({
            className: 'toolbox-example-container',
            item: chart({model: this.model.chartModel})
        });
    }
}