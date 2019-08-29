import {hoistElemFactory} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {lineChart} from './LineChart';
import {ohlcChart} from './OHLCChart';

export const chartsPanel = hoistElemFactory(
    ({model}) => panel({
        title: `Charts: ${model.symbol ? model.symbol : ''}`,
        icon: Icon.chartArea(),
        mask: !model.symbol,
        model: {
            defaultSize: 700,
            side: 'right',
            collapsedRenderMode: 'unmountOnHide',
            prefName: 'portfolioChartsPanelConfig'
        },
        item: tabContainer({
            model: {
                tabs: [
                    {
                        id: 'line',
                        title: 'Trading Volume',
                        content: () => lineChart({
                            model: lineChartModel,
                            flex: 1,
                            className: 'xh-border-right'
                        })
                    },
                    {
                        id: 'ohlc',
                        title: 'Price History',
                        content: () => ohlcChart({
                            model: ohlcChartModel,
                            flex: 1
                        })
                    }
                ]
            }
        })
    })
);