import {chart} from '@xh/hoist/cmp/chart';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {wrapper} from '../../common';
import {PieChartModel} from './PieChartModel';

export const pieChartPanel = hoistCmp.factory({
    model: creates(PieChartModel),

    render() {
        return wrapper({
            description: [
                <p>
                    Hoist provides a lightweight wrapper around the Highcharts charting and visualization library.
                    This integration includes the <code>Chart</code> component to handle basic rendering, layout,
                    and resizing and a <code>ChartModel</code> class to hold an observable config and data series.
                </p>,
                <p>
                    Note that applications must license and specify a compatible version of Highcharts as an application
                    dependency.
                </p>
            ],
            item: panel({
                title: 'Charts › Pie',
                icon: Icon.chartPie(),
                width: '80%',
                height: '60%',
                mask: 'onLoad',
                tbar: tbar(),
                item: chart()
            }),
            links: [
                {url: '$TB/client-app/src/desktop/tabs/charts/PieChartPanel.js', notes: 'This example\'s component.'},
                {url: '$TB/client-app/src/desktop/tabs/charts/PieChartModel.js', notes: 'This example\'s Hoist Model.'},
                {url: '$HR/cmp/chart/Chart.js', notes: 'Hoist wrapper component for Chart sizing and layout.'},
                {url: '$HR/cmp/chart/ChartModel.js', notes: 'Hoist model with observable Chart config and series.'},
                {text: 'Highcharts Docs', url: 'https://api.highcharts.com/highstock/', notes: 'Library API documentation.'}
            ]
        });
    }
});

const tbar = hoistCmp.factory(({model}) => {
    return toolbar(
        groupingChooser({width: 200})
    );
});
