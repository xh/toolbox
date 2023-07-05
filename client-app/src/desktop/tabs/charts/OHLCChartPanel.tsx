import {chart} from '@xh/hoist/cmp/chart';
import {filler, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {wrapper} from '../../common';
import {OHLCChartModel} from './OHLCChartModel';

export const ohlcChartPanel = hoistCmp.factory({
    model: creates(OHLCChartModel),

    render({model}) {
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
                title: 'Charts › OHLC',
                icon: Icon.chartLine(),
                width: '80%',
                height: '60%',
                mask: 'onLoad',
                tbar: tbar(),
                item: chart({aspectRatio: model.aspectRatio})
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/charts/OHLCChartPanel.tsx',
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

const tbar = hoistCmp.factory<OHLCChartModel>(({model}) => {
    return toolbar(
        span('Symbol'),
        select({
            bind: 'currentSymbol',
            options: model.symbols,
            enableFilter: false,
            width: 120
        }),
        toolbarSep(),
        span('Aspect Ratio'),
        numberInput({
            width: 50,
            bind: 'aspectRatio',
            commitOnChange: true,
            selectOnFocus: true,
            min: 0
        }),
        filler(),
        button({
            text: 'Call chart API',
            icon: Icon.code(),
            disabled: !model.chartModel.highchart,
            onClick: () => {
                const xExtremes = model.chartModel.highchart.axes[0].getExtremes();
                XH.alert({
                    title: 'X-axis extremes - as read from chart API',
                    message: JSON.stringify(xExtremes)
                });
            }
        })
    );
});
