import {placeholder} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp, creates} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from '../../AppModel';
import {ChartsModel} from './ChartsModel';
import {lineChart} from './LineChart';
import {ohlcChart} from './OHLCChart';

export const chartsPanel = hoistCmp.factory({
    model: creates(ChartsModel),

    render({model}) {
        return panel({
            title: model.symbol ? `Volume + Pricing: ${model.symbol}` : 'Volume + Pricing',
            icon: Icon.chartArea(),
            modelConfig: {
                defaultSize: 700,
                side: 'right',
                renderMode: 'unmountOnHide',
                modalSupport: true,
                persistWith: {...AppModel.instance.persistWith, path: 'detailChartsSize'}
            },
            item: model.symbol
                ? tabContainer({
                      modelConfig: {
                          persistWith: {
                              ...AppModel.instance.persistWith,
                              path: 'detailChartsTab'
                          },
                          tabs: [
                              {
                                  id: 'line',
                                  title: 'Trading Volume',
                                  content: lineChart
                              },
                              {
                                  id: 'ohlc',
                                  title: 'Price History',
                                  content: ohlcChart
                              }
                          ]
                      }
                  })
                : placeholder(Icon.chartLine(), 'Select an order to view available charts.')
        });
    }
});
