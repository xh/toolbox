import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hframe} from '@xh/hoist/cmp/layout';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {grid} from '@xh/hoist/cmp/grid';
import {splitTreeMap} from '@xh/hoist/cmp/treemap';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {select} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {treeMapDisplayOptions, wrapper, wrapperOption} from '../../common';

import {SplitTreeMapPanelModel} from './SplitTreeMapPanelModel';

export const splitTreeMapPanel = hoistCmp.factory({
    model: creates(SplitTreeMapPanelModel),

    render({model}) {
        return wrapper({
            title: 'Split TreeMap',
            icon: Icon.treeMap(),
            description: [
                'A SplitTreeMap renders two TreeMaps together, partitioning records into two',
                'groups. It is most commonly used to separate positive and negative values',
                'into distinct heatmaps.',
                '',
                'Like the standard TreeMap it binds to a `Store` and stays in sync with the',
                'grid beside it. Use the options at left to adjust orientation, heat, color',
                'mode, theme, and tiling algorithm.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/charts/SplitTreeMapPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/treemap/SplitTreeMap.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/treemap/SplitTreeMapModel.ts',
                    notes: 'Hoist model for configuring SplitTreeMaps.'
                },
                {
                    text: 'Highcharts Docs',
                    url: 'https://api.highcharts.com/highcharts/',
                    notes: 'Underlying charting library.'
                }
            ],
            options: [
                wrapperOption({
                    label: 'Orientation',
                    propName: 'SplitTreeMapConfig.orientation',
                    control: select({
                        model: model.splitTreeMapModel,
                        bind: 'orientation',
                        width: 130,
                        enableFilter: false,
                        options: [
                            {label: 'Horizontal', value: 'horizontal'},
                            {label: 'Vertical', value: 'vertical'}
                        ]
                    })
                }),
                ...treeMapDisplayOptions(model.splitTreeMapModel)
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
                    splitTreeMap()
                )
            })
        });
    }
});

const tbar = hoistCmp.factory<SplitTreeMapPanelModel>(() => toolbar(groupingChooser({width: 200})));
