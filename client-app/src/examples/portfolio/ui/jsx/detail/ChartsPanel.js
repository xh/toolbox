import React from 'react';

import {hoistCmp, uses} from '@xh/hoist/core';
import {Panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {TabContainer} from '@xh/hoist/cmp/tab';
import {Chart} from '@xh/hoist/desktop/cmp/chart';

import {ChartsPanelModel} from '../../../detail/ChartsPanelModel';

export const ChartsPanel = hoistCmp.factory({
    model: uses(ChartsPanelModel),

    render({model}) {
        return <Panel
            title={`Charts: ${model.symbol ? model.symbol : ''}`}
            icon={Icon.chartArea()}
            mask={!model.symbol}
            model={{
                defaultSize: 700,
                side: 'right',
                collapsedRenderMode: 'unmountOnHide',
                prefName: 'portfolioChartsPanelConfig'
            }}
        >
            <TabContainer
                model={{
                    tabs: [
                        {
                            id: 'line',
                            title: 'Trading Volume',
                            content: () => <ChartPanel model={model.lineChartModel}/>
                        },
                        {
                            id: 'ohlc',
                            title: 'Price History',
                            content: () => <ChartPanel model={model.ohlcChartModel}/>
                        }
                    ]
                }}
            />

        </Panel>;
    }
});


const ChartPanel = hoistCmp(
    ({model}) => {
        return <Panel mask={model.loadModel} flex={1}>
            <Chart/>
        </Panel>;
    }
);
