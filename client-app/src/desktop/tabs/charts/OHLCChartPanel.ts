import {chart} from '@xh/hoist/cmp/chart';
import {span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {chartDisplayOptions, wrapper} from '../../common';
import {OHLCChartModel} from './OHLCChartModel';

export const ohlcChartPanel = hoistCmp.factory({
    model: creates(OHLCChartModel),

    render({model}) {
        return wrapper({
            title: 'OHLC Chart',
            icon: Icon.chartLine(),
            description: [
                'Hoist provides a lightweight wrapper around the Highcharts charting and',
                'visualization library. This integration includes the `Chart` component to',
                'handle rendering, layout, and resizing, plus an observable `ChartModel` class',
                'to hold the chart config and data series.',
                '',
                'This example renders financial data as an OHLC (open-high-low-close) chart,',
                'and shows how to reach through `ChartModel` to the underlying Highcharts API',
                'directly via the "Call chart API" button.',
                '',
                'Note that applications must license and specify a compatible version of',
                'Highcharts as an application dependency.'
            ],
            options: chartDisplayOptions(model),
            item: panel({
                height: '60vh',
                width: '90%',
                mask: 'onLoad',
                tbar: tbar(),
                item: chart({aspectRatio: model.aspectRatio})
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/charts/OHLCChartPanel.ts',
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
        })
    );
});
