import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, span} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {chart} from '@xh/hoist/cmp/chart';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {OHLCChartModel} from './OHLCChartModel';
import {wrapper} from '../../common/Wrapper';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';

export const ohlcChartPanel = hoistCmp.factory({
    model: creates(OHLCChartModel),

    render() {
        return wrapper({
            style: {paddingTop: 0},
            item: panel({
                className: 'toolbox-ohlcchart-panel',
                title: 'Charts › OHLC',
                icon: Icon.chartLine(),
                width: 800,
                height: 600,
                item: example(),
                tbar: tbar()
            })
        });
    }
});

const example = hoistCmp.factory(
    ({model}) => chart({
        aspectRatio: model.aspectRatio
    })
);

const tbar = hoistCmp.factory(
    ({model}) => toolbar(
        span('Symbol: '),
        select({
            bind: 'currentSymbol',
            options: model.symbols,
            enableFilter: false,
            width: 120
        }),
        toolbarSep(),
        span('Aspect Ratio: '),
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
    )
);
