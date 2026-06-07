import {ChartModel} from '@xh/hoist/cmp/chart';
import {HoistModel} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {ReactElement} from 'react';
import {wrapperOption} from '../Wrapper';

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
            control: numberInput({
                model,
                bind: 'aspectRatio',
                min: 0,
                width: 90,
                commitOnChange: true,
                selectOnFocus: true
            })
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
        button({
            text: 'Call chart API',
            icon: Icon.code(),
            width: '100%',
            onClick: () => model.callChartApi()
        })
    ];
}
