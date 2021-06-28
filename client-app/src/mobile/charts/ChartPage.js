import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {filler, span, vframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {select} from '@xh/hoist/mobile/cmp/input';
import {ChartPageModel} from './ChartPageModel';
import {chart} from '@xh/hoist/cmp/chart';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {numberInput} from '@xh/hoist/desktop/cmp/input';

export const chartPage = hoistCmp.factory({

    model: creates(ChartPageModel),

    render() {
        return panel({
            title: 'Charts',
            icon: Icon.chartLine(),
            mask: 'onLoad',
            item: example(),
            tbar: tbar()
        });
    }
});

const example = hoistCmp.factory(
    ({model}) => vframe({
        className: 'toolbox-example-container',
        item: chart({
            aspectRatio: model.aspectRatio
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
            width: 80
        }),
        filler(),
        span('Aspect Ratio: '),
        numberInput({
            width: 50,
            bind: 'aspectRatio',
            commitOnChange: true,
            selectOnFocus: true,
            min: 0
        })
        // button({
        //     text: 'Call chart API',
        //     icon: Icon.code(),
        //     disabled: !model.chartModel.highchart,
        //     onClick: () => {
        //         const xExtremes = model.chartModel.highchart.axes[0].getExtremes();
        //         XH.alert({
        //             title: 'X-axis extremes - as read from chart API',
        //             message: JSON.stringify(xExtremes)
        //         });
        //     }
        // })
    )
);
