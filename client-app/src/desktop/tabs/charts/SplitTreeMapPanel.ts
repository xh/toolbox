import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {filler, hframe, span} from '@xh/hoist/cmp/layout';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {grid} from '@xh/hoist/cmp/grid';
import {splitTreeMap} from '@xh/hoist/cmp/treemap';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {select} from '@xh/hoist/desktop/cmp/input';

import {SplitTreeMapPanelModel} from './SplitTreeMapPanelModel';

export const splitTreeMapPanel = hoistCmp.factory({
    model: creates(SplitTreeMapPanelModel),

    render() {
        return panel({
            mask: 'onLoad',
            tbar: tbar(),
            items: hframe(
                panel({
                    modelConfig: {defaultSize: 480, side: 'left'},
                    item: grid()
                }),
                splitTreeMap()
            )
        });
    }
});

const tbar = hoistCmp.factory<SplitTreeMapPanelModel>(({model}) =>
    toolbar(
        groupingChooser({width: 200}),
        filler(),
        span('Orientation'),
        select({
            model: model.splitTreeMapModel,
            bind: 'orientation',
            width: 120,
            enableFilter: false,
            options: [
                {label: 'Horizontal', value: 'horizontal'},
                {label: 'Vertical', value: 'vertical'}
            ]
        }),
        '-',
        span('Max Heat'),
        select({
            model: model.splitTreeMapModel,
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
            model: model.splitTreeMapModel,
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
            model: model.splitTreeMapModel,
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
            model: model.splitTreeMapModel,
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
