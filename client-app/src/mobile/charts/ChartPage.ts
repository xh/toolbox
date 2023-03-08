import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {span, vframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {select} from '@xh/hoist/mobile/cmp/input';
import {chart} from '@xh/hoist/cmp/chart';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';
import {ChartPageModel} from './ChartPageModel';

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

const example = hoistCmp.factory(() =>
    vframe({
        item: chart()
    })
);

const tbar = hoistCmp.factory<ChartPageModel>(({model}) =>
    toolbar(
        span('Symbol: '),
        select({
            bind: 'currentSymbol',
            options: model.symbols,
            enableFilter: false,
            width: 90
        })
    )
);
