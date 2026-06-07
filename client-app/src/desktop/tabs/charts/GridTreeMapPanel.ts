import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hframe} from '@xh/hoist/cmp/layout';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {grid} from '@xh/hoist/cmp/grid';
import {treeMap} from '@xh/hoist/cmp/treemap';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {treeMapDisplayOptions, wrapper, wrapperOption} from '../../common';

import {GridTreeMapModel} from './GridTreeMapModel';

export const gridTreeMapPanel = hoistCmp.factory({
    model: creates(GridTreeMapModel),

    render({model}) {
        return wrapper({
            title: 'Grid TreeMap',
            icon: Icon.treeMap(),
            description: [
                'TreeMaps render hierarchical data as nested, color-coded rectangles. This',
                'heatmap-style view encodes two dimensions of each record in the size and',
                'color of its tile.',
                '',
                'This example binds a TreeMap to the same `Store` and selection model as the',
                'grid beside it, keeping the two views in sync. Use the options at left to',
                'adjust heat, color mode, theme, tiling algorithm, and clustering.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/charts/GridTreeMapPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/treemap/TreeMap.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/treemap/TreeMapModel.ts',
                    notes: 'Hoist model for configuring TreeMaps.'
                },
                {
                    text: 'Highcharts Docs',
                    url: 'https://api.highcharts.com/highcharts/',
                    notes: 'Underlying charting library.'
                }
            ],
            options: [
                ...treeMapDisplayOptions(model.treeMapModel),
                wrapperOption({
                    label: 'Enable clustering',
                    control: switchInput({model, bind: 'cluster'})
                })
            ],
            item: panel({
                height: '100%',
                width: '100%',
                mask: 'onLoad',
                tbar: tbar(),
                items: hframe(
                    panel({
                        modelConfig: {defaultSize: 480, side: 'left'},
                        item: grid()
                    }),
                    treeMap()
                )
            })
        });
    }
});

const tbar = hoistCmp.factory<GridTreeMapModel>(() => toolbar(groupingChooser({width: 200})));
