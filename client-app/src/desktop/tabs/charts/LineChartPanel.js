import {Icon} from '@xh/hoist/icon';
import {hoistComponent, useModel, localModel} from '@xh/hoist/core';
import {wrapper} from '../../common/Wrapper';
import {box, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {select} from '@xh/hoist/desktop/cmp/input';
import {chart} from '@xh/hoist/desktop/cmp/chart';
import {LineChartModel} from './LineChartModel';

export const LineChartPanel = hoistComponent({
    model: localModel(LineChartModel),

    render() {
        const model = useModel();

        return wrapper(
            panel({
                className: 'toolbox-linechart-panel',
                title: 'Charts › Line',
                icon: Icon.chartLine(),
                width: 800,
                height: 600,
                item: vframe({
                    className: 'toolbox-example-container',
                    item: chart({model: model.chartModel})
                }),
                tbar: [
                    box('Symbol: '),
                    select({
                        model,
                        bind: 'currentSymbol',
                        options: model.symbols,
                        enableFilter: false
                    })
                ]
            })
        );
    }
});