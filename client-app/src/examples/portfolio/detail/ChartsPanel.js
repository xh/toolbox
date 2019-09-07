import {hoistElemFactory, providedModel} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {ChartsPanelModel} from './ChartsPanelModel';
import {chart} from '@xh/hoist/desktop/cmp/chart';

export const chartsPanel = hoistElemFactory({
    model: providedModel(ChartsPanelModel),

    render({model}) {
        return panel({
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


const chartPanel = hoistElemFactory(
    ({model}) => {
        return panel({
            item: chart(model.chartModel),
            mask: model.loadModel,
            flex: 1
        });
    }
);
