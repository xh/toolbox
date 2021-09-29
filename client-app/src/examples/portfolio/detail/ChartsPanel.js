import {chart} from '@xh/hoist/cmp/chart';
import {placeholder} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {PERSIST_DETAIL} from '../AppModel';
import {ChartsPanelModel} from './ChartsPanelModel';

export const chartsPanel = hoistCmp.factory({
    model: uses(ChartsPanelModel),

    render({model}) {
        return panel({
            title: model.symbol ? `Volume + Pricing: ${model.symbol}` : 'Volume + Pricing',
            icon: Icon.chartArea(),
            model: {
                defaultSize: 700,
                side: 'right',
                collapsedRenderMode: 'unmountOnHide',
                persistWith: {...PERSIST_DETAIL, path: 'chartPanel'}
            },
            item: model.symbol ?
                tabContainer({
                    model: {
                        persistWith: {...PERSIST_DETAIL, path: 'chartsTab'},
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
                }) :
                placeholder(Icon.chartLine(), 'Select an order to view available charts.')
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
