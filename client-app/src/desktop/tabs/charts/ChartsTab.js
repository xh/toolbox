import {hoistComponent} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {OLHCChartPanel} from './OLHCChartPanel';
import {LineChartPanel} from './LineChartPanel';
import {SimpleTreeMapPanel} from './SimpleTreeMapPanel';
import {GridTreeMapPanel} from './GridTreeMapPanel';
import {SplitTreeMapPanel} from './SplitTreeMapPanel';


export const ChartsTab = hoistComponent(
    () => tabContainer({
        model: {
            route: 'default.charts',
            switcherPosition: 'left',
            tabs: [
                {id: 'olhc', title: 'OLHC', content: OLHCChartPanel},
                {id: 'line', content: LineChartPanel},
                {id: 'simpleTreeMap', title: 'Simple TreeMap', content: SimpleTreeMapPanel},
                {id: 'gridTreeMap', title: 'Grid TreeMap', content: GridTreeMapPanel},
                {id: 'splitTreeMap', title: 'Split TreeMap', content: SplitTreeMapPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
