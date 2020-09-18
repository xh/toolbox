import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
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
            mask: (positionId == null || loadModel.isPending),
            bbar: [
                filterChooser({
                    leftIcon: Icon.filter(),
                    placeholder: 'Filter orders...',
                    enableClear: true,
                    flex: 10,
                    maxWidth: 800
                }),
                gridCountLabel({unit: 'orders'}),
                filler(),
                colChooserButton()
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
    const dimVals = dimValPairs.map((str) => str.split(':')[1]);
    return dimVals.join(' > ');
}
