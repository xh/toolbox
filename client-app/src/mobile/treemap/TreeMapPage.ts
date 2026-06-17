import {creates, hoistCmp} from '@xh/hoist/core';
import {segmentedControl} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {splitTreeMap, treeMap} from '@xh/hoist/cmp/treemap';
import {Icon} from '@xh/hoist/icon';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import {TreeMapPageModel} from './TreeMapPageModel';

export const treeMapPage = hoistCmp.factory({
    model: creates(TreeMapPageModel),
    render({model}) {
        return exampleScreen({
            title: 'Tree Map',
            icon: Icon.treeMap(),
            description: [
                '`TreeMap` renders hierarchical data as nested, sized tiles via Highcharts.',
                '`SplitTreeMap` pairs two maps to contrast positive and negative groups.'
            ],
            options: [
                exampleOption({
                    label: 'Type',
                    control: segmentedControl({
                        model,
                        bind: 'type',
                        fill: false,
                        options: [
                            {value: 'treeMap', label: 'Simple'},
                            {value: 'splitTreeMap', label: 'Split'}
                        ]
                    })
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/treemap/TreeMapPage.ts', notes: 'This example.'},
                {url: '$HR/cmp/treemap/README.md', text: 'TreeMap docs'}
            ],
            item: panel({
                mask: 'onLoad',
                item: model.type === 'treeMap' ? treeMap() : splitTreeMap()
            })
        });
    }
});
