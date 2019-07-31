/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {elemFactory, HoistComponent} from '@xh/hoist/core/index';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {Component} from 'react';

@HoistComponent
export class OrdersPanel extends Component {

    render() {
        const {model} = this,
            {gridModel} = model;

        return panel({
            title: `Orders: ${this.reformatPositionId(model.positionId)}`,
            icon: Icon.edit(),
            item: grid({model: gridModel}),
            mask: model.positionId == null,
            bbar: toolbar(
                filler(),
                gridCountLabel({gridModel, unit: 'orders'}),
                storeFilterField({gridModel}),
                colChooserButton({gridModel})
            )
        });
    }

    //------------------
    // Implementation
    //------------------

    reformatPositionId(positionId) {
        if (positionId) {
            const dimValPairs = positionId.split('>>').splice(1);
            const dimVals = dimValPairs.map((str) => str.split(':')[1]);
            return dimVals.join(' > ');
        } else {
            return '';
        }
    }
}
export const ordersPanel = elemFactory(OrdersPanel);