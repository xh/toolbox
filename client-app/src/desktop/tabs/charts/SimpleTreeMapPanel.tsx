import {span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {treeMap} from '@xh/hoist/desktop/cmp/treemap';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
import {wrapper} from '../../common';
import {SimpleTreeMapModel} from './SimpleTreeMapModel';

export const simpleTreeMapPanel = hoistCmp.factory({
    model: creates(SimpleTreeMapModel),

    render() {
        return wrapper({
            description: [
                <p>
                    Support for TreeMap visualizations is provided via the Highcharts charting and
                    visualization library, with a set of wrapper components and models provided by
                    Hoist to allow binding to a <code>GridModel</code> or
                    <code>Store</code> and to customize map defaults to be more immediately useful
                    and relevant for visualizing financial data. The base <code>TreeMap</code>{' '}
                    component is shown below - see the other tabs on this page for more advanced
                    integrations/variations.
                </p>,
                <p>
                    Note that applications must license and specify a compatible version of
                    Highcharts as an application dependency.
                </p>
            ],
            item: panel({
                icon: Icon.gridLarge(),
                title: 'Simple TreeMap',
                width: '80%',
                height: '60%',
                mask: 'onLoad',
                tbar: tbar(),
                item: treeMap()
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/charts/SimpleTreeMapPanel.tsx',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/treemap/TreeMap.ts',
                    notes: 'Hoist wrapper component for TreeMap sizing and layout.'
                },
                {
                    url: '$HR/desktop/cmp/treemap/TreeMapModel.ts',
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

const tbar = hoistCmp.factory<SimpleTreeMapModel>(({model}) =>
    toolbar(
        span('Max Heat'),
        select({
            model: model.treeMapModel,
            bind: 'maxHeat',
            width: 120,
            enableFilter: false,
            options: [
                {label: 'None (auto)', value: undefined},
                {label: '0.5', value: 0.5},
                {label: '1', value: 1},
                {label: '2', value: 2}
            ]
        }),
        '-',
        span('Color Mode'),
        select({
            model: model.treeMapModel,
            bind: 'colorMode',
            width: 120,
            enableFilter: false,
            options: [
                {label: 'Linear', value: 'linear'},
                {label: 'Wash', value: 'wash'},
                {label: 'None', value: 'none'}
            ]
        }),
        '-',
        span('Theme'),
        select({
            model: model.treeMapModel,
            bind: 'theme',
            width: 120,
            enableFilter: false,
            options: [
                {label: 'Default', value: undefined},
                {label: 'Light', value: 'light'},
                {label: 'Dark', value: 'dark'}
            ]
        }),
        '-',
        span('Algorithm'),
        select({
            model: model.treeMapModel,
            bind: 'algorithm',
            width: 120,
            enableFilter: false,
            options: [
                {label: 'Squarified', value: 'squarified'},
                {label: 'Slice and Dice', value: 'sliceAndDice'},
                {label: 'Stripes', value: 'stripes'},
                {label: 'Strip', value: 'strip'}
            ]
        })
    )
);
