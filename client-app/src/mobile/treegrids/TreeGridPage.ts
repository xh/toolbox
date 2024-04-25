import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {grid, TreeStyle} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {label, select, switchInput} from '@xh/hoist/mobile/cmp/input';
import {groupingChooser} from '@xh/hoist/mobile/cmp/grouping';
import {colAutosizeButton, colChooserButton} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {TreeGridPageModel} from './TreeGridPageModel';

export const treeGridPage = hoistCmp.factory({
    model: creates(TreeGridPageModel),

    render({model}) {
        const {gridModel} = model;
        return panel({
            title: 'Tree Grids',
            icon: Icon.grid(),
            mask: 'onLoad',
            item: grid(),
            tbar: [
                label('Style:'),
                select({
                    width: 200,
                    model: gridModel,
                    bind: 'treeStyle',
                    options: [
                        {value: TreeStyle.NONE, label: 'None'},
                        {value: TreeStyle.HIGHLIGHTS, label: 'Highlight Groups'},
                        {value: TreeStyle.COLORS, label: 'Color Groups'},
                        {value: TreeStyle.BORDERS, label: 'Group Borders'},
                        {
                            value: TreeStyle.HIGHLIGHTS_AND_BORDERS,
                            label: 'Highlight Groups w/Borders'
                        },
                        {value: TreeStyle.COLORS_AND_BORDERS, label: 'Color Groups w/Borders'}
                    ]
                }),
                label('Borders:'),
                switchInput({
                    model: gridModel,
                    bind: 'rowBorders'
                })
            ],
            bbar: [
                groupingChooser({maxWidth: 250}),
                filler(),
                colAutosizeButton(),
                colChooserButton()
            ]
        });
    }
});
