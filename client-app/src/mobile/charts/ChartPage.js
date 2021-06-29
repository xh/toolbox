import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {filler, span, vframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {select, numberInput} from '@xh/hoist/mobile/cmp/input';
import {chart} from '@xh/hoist/cmp/chart';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {button} from '@xh/hoist/mobile/cmp/button';
import {ChartPageModel} from './ChartPageModel';

export const chartPage = hoistCmp.factory({

    model: creates(ChartPageModel),

    render() {
        return panel({
            title: 'Charts',
            icon: Icon.chartLine(),
            mask: 'onLoad',
            item: example(),
            tbar: tbar(),
            bbar: bbar()
        });
    }
});

const example = hoistCmp.factory(
    ({model}) => vframe({
        className: 'toolbox-example-container',
        item: chart({
            aspectRatio: model.aspectRatio || 0
        })
    })
);

const tbar = hoistCmp.factory(
    ({model}) => toolbar(
        span('Symbol: '),
        select({
            bind: 'currentSymbol',
            options: model.symbols,
            enableFilter: false,
            width: 90
        }),
        filler(),
        span('Aspect Ratio: '),
        numberInput({
            width: 50,
            bind: 'aspectRatio',
            commitOnChange: true,
            selectOnFocus: true,
            min: 0,
            style: {backgroundColor: 'white'}
        })
    )
);

const bbar = hoistCmp.factory(
    ({model}) => toolbar(
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