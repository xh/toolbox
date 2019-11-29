import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {OHLCChartPanel} from './OHLCChartPanel';
import {LineChartPanel} from './LineChartPanel';
import {SimpleTreeMapPanel} from './SimpleTreeMapPanel';
import {GridTreeMapPanel} from './GridTreeMapPanel';
import {SplitTreeMapPanel} from './SplitTreeMapPanel';


export const ChartsTab = hoistCmp(
    () => tabContainer({
        model: {
            route: 'default.charts',
            switcherPosition: 'left',
            tabs: [
                {id: 'ohlc', title: 'OHLC', content: OHLCChartPanel},
                {id: 'line', content: LineChartPanel},
                {id: 'simpleTreeMap', title: 'Simple TreeMap', content: SimpleTreeMapPanel},
                {id: 'gridTreeMap', title: 'Grid TreeMap', content: GridTreeMapPanel},
                {id: 'splitTreeMap', title: 'Split TreeMap', content: SplitTreeMapPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
