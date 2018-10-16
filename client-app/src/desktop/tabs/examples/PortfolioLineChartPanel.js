/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common/Wrapper';
import {vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {comboBox, label} from '@xh/hoist/desktop/cmp/form';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {chart} from '@xh/hoist/desktop/cmp/chart';
import {PortfolioLineChartModel} from './PortfolioLineChartModel';

@HoistComponent
export class PortfolioLineChartPanel extends Component {
    localModel = new PortfolioLineChartModel();

    render() {
        const model = this.model,
            {companyMap} = model;
        return wrapper(
            panel({
                className: 'toolbox-linechart-panel',
                title: 'Line Chart',
                width: 740,
                height: 400,
                item: vframe({
                    className: 'toolbox-example-container',
                    item: chart({model: this.model.chartModel})
                }),
                tbar: toolbar(
                    label('Company: '),
                    comboBox({
                        model,
                        options: Object.keys(companyMap),
                        field: 'currentCompany'
                    }),
                )
            })
        );
    }
}
export const portfolioLineChartPanel = elemFactory(PortfolioLineChartPanel);
