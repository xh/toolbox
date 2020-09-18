import {creates, hoistCmp} from '@xh/hoist/core';
import {box} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {select} from '@xh/hoist/desktop/cmp/input';
import {chart} from '@xh/hoist/cmp/chart';
import {LineChartModel} from '../../../charts/LineChartModel';

export const chartWidget = hoistCmp.factory({
    model: creates(LineChartModel),
    render({model}) {
        return panel({
            item: chart(),
            bbar: [
                box('Symbol: '),
                select({
                    bind: 'currentSymbol',
                    options: model.symbols,
                    enableFilter: false
                })
            ]
        });
    }
});