import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {filler, hframe, span} from '@xh/hoist/cmp/layout';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {grid} from '@xh/hoist/cmp/grid';
import {treeMap} from '@xh/hoist/desktop/cmp/treemap';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {select} from '@xh/hoist/desktop/cmp/input';

import {GridTreeMapModel} from './GridTreeMapModel';

export const gridTreeMapPanel = hoistCmp.factory({
    model: creates(GridTreeMapModel),

    render() {
        return panel({
            mask: 'onLoad',
            tbar: tbar(),
            items: hframe(
                panel({
                    model: {defaultSize: 480, side: 'left'},
                    item: grid()
                }),
                treeMap()
            )
        });
    }
});

const tbar = hoistCmp.factory(
    ({model}) => toolbar(
        groupingChooser(),
        filler(),
        span('Max Heat'),
        select({
            model: model.treeMapModel,
            bind: 'maxHeat',
            width: 120,
            options: [
                {label: 'None (auto)', value: undefined},
                {label: '1', value: 1},
                {label: '2', value: 2},
                {label: '5', value: 5}
            ]
        }),
        '-',
        span('Color Mode'),
        select({
            model: model.treeMapModel,
            bind: 'colorMode',
            width: 120,
            options: [
                {label: 'Linear', value: 'linear'},
                {label: 'Balanced', value: 'balanced'},
                {label: 'Wash', value: 'wash'},
                {label: 'None', value: 'none'}
            ]
        }),
        '-',
        span('Algorithm'),
        select({
            model: model.treeMapModel,
            bind: 'algorithm',
            width: 120,
            options: [
                {label: 'Squarified', value: 'squarified'},
                {label: 'Slice and Dice', value: 'sliceAndDice'},
                {label: 'Stripes', value: 'stripes'},
                {label: 'Strip', value: 'strip'}
            ]
        })
    )
);