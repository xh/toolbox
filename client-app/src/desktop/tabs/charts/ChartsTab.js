import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {OLHCChartPanel} from './OLHCChartPanel';
import {LineChartPanel} from './LineChartPanel';

@HoistComponent
export class ChartsTab extends Component {

    render() {
        return tabContainer({
            model: {
                route: 'default.charts',
                switcherPosition: 'left',
                tabs: [
                    {id: 'olhc', title: 'OLHC', content: OLHCChartPanel},
                    {id: 'line', content: LineChartPanel}
                ]
            },
            className: 'toolbox-tab'
        });
    }
}
