import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {printGridButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {GridPanelModel} from './GridPanelModel';
import {PERSIST_MAIN} from './AppModel';

export const gridPanel = hoistCmp.factory({
    model: uses(GridPanelModel),

    render({model}) {
        const {collapsedTitle} = model;

        return panel({
            modelConfig: {
                defaultSize: 500,
                side: 'left',
                persistWith: {...PERSIST_MAIN, path: 'positionsPanel'}
            },
            collapsedTitle,
            collapsedIcon: Icon.treeList(),
            compactHeader: true,
            tbar: [groupingChooser({flex: 1, icon: Icon.treeList()})],
            item: grid({agOptions: {groupDefaultExpanded: 1}}),
            bbar: [
                gridCountLabel({unit: 'position'}),
                filler(),
                relativeTimestamp({bind: 'loadTimestamp'}),
                refreshButton({model: XH.refreshContextModel, intent: 'success'}),
                printGridButton()
            ]
        });
    }
});
