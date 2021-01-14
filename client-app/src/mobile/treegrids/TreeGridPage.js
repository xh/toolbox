import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {groupingChooser} from '@xh/hoist/mobile/cmp/grouping';
import {colAutosizeButton, colChooserButton} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {TreeGridPageModel} from './TreeGridPageModel';

export const treeGridPage = hoistCmp.factory({
    model: creates(TreeGridPageModel),

    render() {
        return panel({
            title: 'Tree Grids',
            icon: Icon.grid(),
            mask: 'onLoad',
            item: grid({
                onRowClicked: (e) => {
                    const id = encodeURIComponent(e.data.raw.id);
                    XH.appendRoute('treeGridDetail', {id});
                }
            }),
            bbar: [
                groupingChooser({maxWidth: 250}),
                filler(),
                colAutosizeButton(),
                colChooserButton()
            ]
        });
    }
});