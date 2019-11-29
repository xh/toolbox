import {hoistCmp, creates} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, filler, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {chart} from '@xh/hoist/desktop/cmp/chart';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {controlGroup} from '@xh/hoist/kit/blueprint';
import {OLHCChartModel} from './OLHCChartModel';
import {wrapper} from '../../common/Wrapper';


export const OHLCChartPanel = hoistCmp({
    model: creates(OLHCChartModel),

    render({model}) {
        return wrapper({
            style: {paddingTop: 0},
            item: panel({
                className: 'toolbox-ohlcchart-panel',
                title: 'Charts › OHLC',
                icon: Icon.chartLine(),
                width: 800,
                height: 600,
                item: example(),
                tbar: [
                    box('Symbol: '),
                    select({
                        bind: 'currentSymbol',
                        options: model.symbols,
                        enableFilter: false
                    }),
                    filler(),
                    box('Aspect Ratio: '),
                    controlGroup(
                        numberInput({
                            width: 50,
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
});

const example = hoistCmp.factory(
    ({model}) => vframe({
        className: 'toolbox-example-container',
        item: chart({
            aspectRatio: model.aspectRatio
        })
    })
);