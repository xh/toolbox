import {creates, hoistCmp} from '@xh/hoist/core';
import {numberInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {treeMap} from '@xh/hoist/cmp/treemap';
import {Icon} from '@xh/hoist/icon';
import {treeMapDisplayOptions, wrapper, wrapperOption} from '../../common';
import {SimpleTreeMapModel} from './SimpleTreeMapModel';

export const simpleTreeMapPanel = hoistCmp.factory({
    model: creates(SimpleTreeMapModel),

    render({model}) {
        return wrapper({
            title: 'Simple TreeMap',
            icon: Icon.treeMap(),
            description: [
                'TreeMap visualizations are provided via the Highcharts library, wrapped by',
                'Hoist components and models that bind directly to a `Store` or `GridModel`',
                'and tune the map defaults for visualizing financial data. The base TreeMap is',
                'shown below; see the other tabs on this page for more advanced variations.',
                '',
                'Note that applications must license and specify a compatible version of',
                'Highcharts as an application dependency.'
            ],
            options: [
                ...treeMapDisplayOptions(model.treeMapModel),
                wrapperOption({
                    label: 'Enable clustering',
                    control: switchInput({model, bind: 'cluster'})
                }),
                wrapperOption({
                    label: 'Threshold Width (px)',
                    control: numberInput({
                        model,
                        bind: 'clusterWidthThreshold',
                        disabled: !model.cluster,
                        width: 70
                    })
                }),
                wrapperOption({
                    label: 'Threshold Height (px)',
                    control: numberInput({
                        model,
                        bind: 'clusterHeightThreshold',
                        disabled: !model.cluster,
                        width: 70
                    })
                })
            ],
            item: panel({
                height: '60vh',
                width: '90%',
                mask: 'onLoad',
                item: treeMap()
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/charts/SimpleTreeMapPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/treemap/TreeMap.ts',
                    notes: 'Hoist wrapper component for TreeMap sizing and layout.'
                },
                {
                    url: '$HR/cmp/treemap/TreeMapModel.ts',
                    notes: 'Hoist model with support for store/grid binding.'
                },
                {
                    text: 'Highcharts Docs',
                    url: 'https://api.highcharts.com/highcharts/',
                    notes: 'Library API documentation.'
                }
            ]
        });
    }
});
