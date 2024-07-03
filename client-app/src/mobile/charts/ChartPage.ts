import {chart} from '@xh/hoist/cmp/chart';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {select} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {ChartPageModel} from './ChartPageModel';

export const chartPage = hoistCmp.factory({
    model: creates(ChartPageModel),

    render({model}) {
        return panel({
            title: 'Charts',
            icon: Icon.chartLine(),
            tbar: [
                select({
                    bind: 'currentSymbol',
                    options: model.symbols,
                    enableFilter: false,
                    width: 120
                })
            ],
            item: chart(),
            mask: 'onLoad'
        });
    }
});
