import {chart} from '@xh/hoist/cmp/chart';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {select} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import {ChartPageModel} from './ChartPageModel';

export const chartPage = hoistCmp.factory({
    model: creates(ChartPageModel),

    render({model}) {
        return exampleScreen({
            title: 'Chart',
            icon: Icon.chartLine(),
            description: [
                '`Chart` wraps Highcharts with a Hoist-friendly, observable API. Pick a symbol here to',
                'swap the series rendered in the live chart behind this sheet.'
            ],
            options: [
                exampleOption({
                    label: 'Symbol',
                    control: select({
                        model,
                        bind: 'currentSymbol',
                        options: model.symbols,
                        enableFilter: false,
                        width: 140
                    })
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/charts/ChartPage.ts', notes: 'This example.'},
                {
                    url: '$HR/cmp/chart/ChartModel.ts',
                    text: 'ChartModel',
                    notes: 'Holds the Highcharts config.'
                },
                {
                    url: 'https://api.highcharts.com/highcharts/',
                    text: 'Highcharts API',
                    notes: 'Reference for the chart config object.'
                }
            ],
            item: panel({mask: 'onLoad', item: chart()})
        });
    }
});
