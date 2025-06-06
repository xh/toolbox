import {chart} from '@xh/hoist/cmp/chart';
import {filler, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {wrapper} from '../../common';
import {LineChartModel} from './LineChartModel';

export const lineChartPanel = hoistCmp.factory({
    model: creates(LineChartModel),

    render() {
        return wrapper({
            description: [
                <p>
                    Hoist provides a lightweight wrapper around the Highcharts charting and
                    visualization library. This integration includes the <code>Chart</code>{' '}
                    component to handle basic rendering, layout, and resizing and a{' '}
                    <code>ChartModel</code> class to hold an observable config and data series.
                </p>,
                <p>
                    Note that applications must license and specify a compatible version of
                    Highcharts as an application dependency.
                </p>
            ],
            item: panel({
                title: 'Charts › Line',
                icon: Icon.chartLine(),
                width: '80%',
                height: '60%',
                mask: 'onLoad',
                tbar: tbar(),
                item: chart()
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/charts/LineChartPanel.tsx',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/chart/Chart.ts',
                    notes: 'Hoist wrapper component for Chart sizing and layout.'
                },
                {
                    url: '$HR/cmp/chart/ChartModel.ts',
                    notes: 'Hoist model with observable Chart config and series.'
                },
                {
                    text: 'Highcharts Docs',
                    url: 'https://api.highcharts.com/highstock/',
                    notes: 'Library API documentation.'
                }
            ]
        });
    }
});

const tbar = hoistCmp.factory<LineChartModel>(({model}) => {
    return toolbar(
        span('Symbol'),
        select({
            bind: 'currentSymbols',
            options: model.symbols,
            enableFilter: false,
            enableMulti: true,
            width: '40%'
        }),
        filler(),
        span('Context Menu'),
        select({
            bind: 'currentContextMenu',
            options: model.contextMenuOptions,
            enableFilter: false
        })
    );
});
