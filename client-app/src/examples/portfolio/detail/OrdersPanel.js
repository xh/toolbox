
import {uses} from '@xh/hoist/core';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core/index';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {Icon} from '@xh/hoist/icon';
import {OrdersPanelModel} from './OrdersPanelModel';

export const ordersPanel = hoistCmp.factory({
    model: uses(OrdersPanelModel),

    render({model}) {
        const {positionId} = model;

        return panel({
            title: `Orders: ${formatPositionId(positionId)}`,
            icon: Icon.edit(),
            item: grid(),
            mask: positionId == null,
            bbar: [
                filler(),
                gridCountLabel({unit: 'orders'}),
                storeFilterField(),
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