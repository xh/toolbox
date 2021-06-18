import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {groupingChooser} from '@xh/hoist/mobile/cmp/grouping';
import {expandCollapseButton, colAutosizeButton, colChooserButton} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {TreeGridPageModel} from './TreeGridPageModel';

export const treeGridPage = hoistCmp.factory({
    model: creates(TreeGridPageModel),

    render() {
        return panel({
            title: 'Tree Grids',
            icon: Icon.grid(),
            mask: 'onLoad',
            item: grid(),
            bbar: [
                groupingChooser({maxWidth: 250}),
                filler(),
                expandCollapseButton(),
                colAutosizeButton(),
                colChooserButton()
            ]
        });
    }
});