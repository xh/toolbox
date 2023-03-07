import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {ohlcChartPanel} from './OHLCChartPanel';
import {lineChartPanel} from './LineChartPanel';
import {simpleTreeMapPanel} from './SimpleTreeMapPanel';
import {gridTreeMapPanel} from './GridTreeMapPanel';
import {splitTreeMapPanel} from './SplitTreeMapPanel';

export const chartsTab = hoistCmp.factory(() =>
    tabContainer({
        modelConfig: {
            route: 'default.charts',
            switcher: {orientation: 'left'},
            tabs: [
                {id: 'line', content: lineChartPanel},
                {id: 'ohlc', title: 'OHLC', content: ohlcChartPanel},
                {id: 'simpleTreeMap', title: 'TreeMap', content: simpleTreeMapPanel},
                {id: 'gridTreeMap', title: 'Grid TreeMap', content: gridTreeMapPanel},
                {id: 'splitTreeMap', title: 'Split TreeMap', content: splitTreeMapPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
