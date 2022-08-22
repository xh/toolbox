import {placeholder} from '@xh/hoist/cmp/layout';
import {hoistCmp, creates} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {PERSIST_DETAIL} from '../../AppModel';
import {ChartsPanelModel} from './ChartsPanelModel';
import {ohlcChart} from './OHLCChart';

export const chartsPanel = hoistCmp.factory({
    model: creates(ChartsPanelModel),

    render({model}) {
        return panel({
            title: model.symbol ? `Price History: ${model.symbol}` : 'Price History',
            icon: Icon.chartArea(),
            model: {
                defaultSize: 700,
                side: 'right',
                renderMode: 'unmountOnHide',
                modalSupport: true,
                persistWith: {...PERSIST_DETAIL, path: 'chartPanel'}
            },
            item: model.symbol ?
                ohlcChart() :
                placeholder(Icon.chartLine(), 'Select an order to view available charts.')
        });
    }
});


