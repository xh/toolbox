import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {viewManager} from '@xh/hoist/desktop/cmp/viewManager';
import {Icon} from '@xh/hoist/icon';
import {GridPanelModel} from './GridPanelModel';

export const gridPanel = hoistCmp.factory({
    model: uses(GridPanelModel),

    render({model}) {
        const {collapsedTitle} = model;

        return panel({
            model: model.panelModel,
            collapsedTitle,
            collapsedIcon: Icon.treeList(),
            compactHeader: true,
            tbar: [
                viewManager({viewMenuProps: {}}),
                groupingChooser({flex: 1, icon: Icon.treeList()})
            ],
            item: grid({agOptions: {groupDefaultExpanded: 1}}),
            bbar: [
                gridCountLabel({unit: 'position'}),
                filler(),
                relativeTimestamp({bind: 'loadTimestamp'}),
                refreshButton({model: XH.refreshContextModel, intent: 'success'})
            ]
        });
    }
});
