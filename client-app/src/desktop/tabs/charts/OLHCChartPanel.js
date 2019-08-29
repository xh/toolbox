import {hoistComponent, useLocalModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, filler, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {chart} from '@xh/hoist/desktop/cmp/chart';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {controlGroup} from '@xh/hoist/kit/blueprint';
import {OLHCChartModel} from './OLHCChartModel';
import {wrapper} from '../../common/Wrapper';


export const OLHCChartPanel = hoistComponent(
    () => {
        const model = useLocalModel(OLHCChartModel);

        return wrapper({
            style: {paddingTop: 0},
            item: panel({
                className: 'toolbox-olhcchart-panel',
                title: 'Charts › OHLC',
                icon: Icon.chartLine(),
                width: 800,
                height: 600,
                item: renderExample(model),
                tbar: [
                    box('Symbol: '),
                    select({
                        model,
                        bind: 'currentSymbol',
                        options: model.symbols,
                        enableFilter: false
                    }),
                    filler(),
                    box('Aspect Ratio: '),
                    controlGroup(
                        numberInput({
                            width: 50,
                            model,
                            bind: 'aspectRatio',
                            commitOnChange: true,
                            min: 0
                        }),
                        button({
                            icon: Icon.x(),
                            onClick: () => model.setAspectRatio(null)
                        })
                    )
                ]
            })
        });
    }
);

function renderExample(model) {
    return vframe({
        className: 'toolbox-example-container',
        item: chart({
            model: model.chartModel,
            aspectRatio: model.aspectRatio
        })
    });
}