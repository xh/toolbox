import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common/Wrapper';
import {box, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {select} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {chart} from '@xh/hoist/desktop/cmp/chart';
import {LineChartModel} from './LineChartModel';

@HoistComponent
export class LineChartPanel extends Component {
    model = new LineChartModel();

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
                    box('Company: '),
                    select({
                        model,
                        field: 'currentCompany',
                        options: Object.keys(companyMap),
                        enableFilter: false
                    })
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