import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {chart} from '@xh/hoist/cmp/chart';
import {ChartsPanelModel} from './ChartsPanelModel';
import {PERSIST_DETAIL} from '../AppModel';

export const chartsPanel = hoistCmp.factory({
    model: uses(ChartsPanelModel),

    render({model}) {
        return panel({
            title: `Charts: ${model.symbol ? model.symbol : ''}`,
            icon: Icon.chartArea(),
            mask: !model.symbol,
            model: {
                defaultSize: 700,
                side: 'right',
                collapsedRenderMode: 'unmountOnHide',
                persistWith: {...PERSIST_DETAIL, path: 'chartPanel'}
            },
            item: tabContainer({
                model: {
                    tabs: [
                        {
                            id: 'line',
                            title: 'Trading Volume',
                            content: () => chartPanel({model: model.lineChartModel})
                        },
                        {
                            id: 'ohlc',
                            title: 'Price History',
                            content: () => chartPanel({model: model.ohlcChartModel})
                        }
                    ]
                }
            })
        });
    }
});


const chartPanel = hoistCmp.factory(
    () =>  panel({
        item: chart(),
        mask: 'onLoad',
        flex: 1
    })
);
