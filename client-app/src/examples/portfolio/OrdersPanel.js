/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {grid} from '@xh/hoist/cmp/grid';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {storeCountLabel, storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {filler} from '@xh/hoist/cmp/layout';

@HoistComponent
export class OrdersPanel extends Component {

    render() {
        const {model} = this,
            {gridModel} = model;

        return panel({
            title: 'Orders',
            icon: Icon.edit(),
            item: grid({model: gridModel}),
            mask: model.positionId == null,
            bbar: toolbar(
                filler(),
                storeCountLabel({gridModel, unit: 'orders'}),
                storeFilterField({gridModel}),
                colChooserButton({gridModel})
            )
        });
    }
}
export const ordersPanel = elemFactory(OrdersPanel);