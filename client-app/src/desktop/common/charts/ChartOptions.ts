import {ChartModel} from '@xh/hoist/cmp/chart';
import {HoistModel} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {ReactElement} from 'react';
import {wrapperAction, wrapperOption} from '../Wrapper';

/** Shape a chart example model must satisfy to render the shared chart display options. */
export type ChartExampleModel = HoistModel & {
    aspectRatio: number;
    currentContextMenu: any;
    contextMenuOptions: Array<{label: string; value: any}>;
    chartModel: ChartModel;
    callChartApi: () => void;
};

/**
 * Shared display options for the chart examples (Line, OHLC) as a set of `wrapperOption` rows for a
 * Wrapper `options` section: the Chart aspect ratio, a context-menu mode selector, and a "Call chart
 * API" action demonstrating direct access to the underlying Highcharts instance via `ChartModel`.
 */
export function chartDisplayOptions(model: ChartExampleModel): ReactElement[] {
    return [
        wrapperOption({
            label: 'Aspect Ratio',
            propName: 'ChartProps.aspectRatio',
            control: select({
                model,
                bind: 'aspectRatio',
                width: 150,
                enableFilter: false,
                hideSelectedOptionCheck: true,
                options: [
                    {label: 'Unconstrained', value: null},
                    {label: '2:1 (wide)', value: 2},
                    {label: '3:2', value: 1.5},
                    {label: '1:1 (square)', value: 1}
                ]
            }),
            info: 'Width-to-height ratio for the chart; unconstrained fills the available space.'
        }),
        wrapperOption({
            label: 'Context Menu',
            control: select({
                model,
                bind: 'currentContextMenu',
                width: 130,
                enableFilter: false,
                options: model.contextMenuOptions
            })
        }),
        wrapperAction({
            text: 'Call chart API',
            icon: Icon.code(),
            intent: 'primary',
            onClick: () => model.callChartApi()
        })
    ];
}
