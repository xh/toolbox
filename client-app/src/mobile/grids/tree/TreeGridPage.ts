import {grid, TreeStyle} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {
    colAutosizeButton,
    colChooserButton,
    expandToLevelButton
} from '@xh/hoist/mobile/cmp/button';
import {groupingChooser} from '@xh/hoist/mobile/cmp/grouping';
import {select, switchInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {exampleOption, exampleScreen} from '../../cmp/example/ExampleScreen';
import {TreeGridPageModel} from './TreeGridPageModel';

export const treeGridPage = hoistCmp.factory({
    model: creates(TreeGridPageModel),

    render({model}) {
        const {gridModel} = model;
        return exampleScreen({
            title: 'Tree Grids',
            icon: Icon.treeList(),
            description: [
                "Hoist's `Grid` renders hierarchical tree data from a `Store` whose records carry",
                'children. Group with the chooser above the grid, and restyle the tree groups with the',
                'options here.'
            ],
            options: [
                exampleOption({
                    label: 'Tree style',
                    control: select({
                        width: 220,
                        model: gridModel,
                        bind: 'treeStyle',
                        options: [
                            {value: TreeStyle.NONE, label: 'None'},
                            {value: TreeStyle.HIGHLIGHTS, label: 'Highlight Groups'},
                            {value: TreeStyle.COLORS, label: 'Color Groups'},
                            {value: TreeStyle.BORDERS, label: 'Group Borders'},
                            {value: TreeStyle.HIGHLIGHTS_AND_BORDERS, label: 'Highlight w/Borders'},
                            {value: TreeStyle.COLORS_AND_BORDERS, label: 'Color w/Borders'}
                        ]
                    })
                }),
                exampleOption({
                    label: 'Row borders',
                    control: switchInput({model: gridModel, bind: 'rowBorders'})
                })
            ],
            links: [
                {
                    url: '$TB/client-app/src/mobile/grids/tree/TreeGridPage.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/grid/README.md',
                    text: 'Grid docs',
                    notes: 'Tree grids & grouping'
                }
            ],
            item: panel({
                mask: 'onLoad',
                tbar: [
                    groupingChooser({maxWidth: 250}),
                    filler(),
                    expandToLevelButton(),
                    colAutosizeButton(),
                    colChooserButton()
                ],
                item: grid()
            })
        });
    }
});
