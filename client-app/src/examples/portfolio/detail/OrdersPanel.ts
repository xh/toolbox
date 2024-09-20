import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {hspacer} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {OrdersPanelModel} from './OrdersPanelModel';

export const ordersPanel = hoistCmp.factory({
    model: uses(OrdersPanelModel),

    render({model}) {
        const {positionId, loadModel} = model;
        return panel({
            title: `Orders: ${formatPositionId(positionId)}`,
            icon: Icon.edit(),
            item: grid(),
            mask: positionId == null || loadModel.isPending,
            headerItems: [gridCountLabel({unit: 'orders'}), hspacer()],
            bbar: [
                filterChooser({
                    placeholder: 'Filter orders...',
                    enableClear: true,
                    flex: 1
                }),
                '-',
                colChooserButton(),
                exportButton()
            ]
        });
    }
});

//------------------
// Implementation
//------------------
function formatPositionId(positionId) {
    if (!positionId) return '';

    const dimValPairs = positionId.split('>>').splice(1);
    const dimVals = dimValPairs.map(str => str.split(':')[1]);
    return dimVals.join(' > ');
}
