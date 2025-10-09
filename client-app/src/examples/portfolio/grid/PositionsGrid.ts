import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {colChooserButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {PositionsGridModel} from './PositionsGridModel';

export const positionsGrid = hoistCmp.factory({
    model: uses(PositionsGridModel),

    render({model}) {
        const {collapsedTitle, persistWith} = model;

        return panel({
            modelConfig: {
                defaultSize: 500,
                side: 'left',
                persistWith: {...persistWith, path: 'positionsGridPanel'}
            },
            collapsedTitle,
            collapsedIcon: Icon.treeList(),
            compactHeader: true,
            tbar: [groupingChooser({flex: 1, icon: Icon.treeList()}), '-', colChooserButton()],
            item: grid(),
            bbar: [
                gridCountLabel({unit: 'position'}),
                filler(),
                relativeTimestamp({bind: 'loadTimestamp'}),
                refreshButton({target: XH.refreshContextModel, intent: 'success'})
            ]
        });
    }
});
