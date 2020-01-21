import {XH, hoistCmp, creates} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {grid} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {dimensionChooser} from '@xh/hoist/mobile/cmp/dimensionchooser';
import {colChooserButton} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';

import {TreeGridPageModel} from './TreeGridPageModel';

export const treeGridPage = hoistCmp.factory({
    model: creates(TreeGridPageModel),

    render() {
        return page({
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
                dimensionChooser(),
                filler(),
                colChooserButton()
            ]
        });
    }
});