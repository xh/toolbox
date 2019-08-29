import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {hoistElemFactory} from '@xh/hoist/core/index';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {Icon} from '@xh/hoist/icon';

export const ordersPanel = hoistElemFactory(
    ({model, ...rest}) => {
        const {gridModel} = model;

        return panel({
            title: `Orders: ${formatPositionId(model.positionId)}`,
            icon: Icon.edit(),
            item: grid({model: gridModel}),
            mask: model.positionId == null,
            bbar: [
                filler(),
                gridCountLabel({gridModel, unit: 'orders'}),
                storeFilterField({gridModel}),
                colChooserButton({gridModel})
            ],
            ...rest
        });
    }
);

//------------------
// Implementation
//------------------
function formatPositionId(positionId) {
    if (!positionId) return '';

    const dimValPairs = positionId.split('>>').splice(1);
    const dimVals = dimValPairs.map((str) => str.split(':')[1]);
    return dimVals.join(' > ');
}