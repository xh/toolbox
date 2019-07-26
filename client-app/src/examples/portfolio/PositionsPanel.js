/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {elemFactory, HoistComponent, LayoutSupport} from '@xh/hoist/core/index';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {Component} from 'react';

@HoistComponent
@LayoutSupport
export class PositionsPanel extends Component {

    render() {
        const {model} = this;

        return panel({
            title: 'Positions',
            icon: Icon.portfolio(),
            mask: model.loadModel,
            model: {
                defaultSize: 500,
                side: 'left'
            },
            item: grid({model: model.gridModel}),
            bbar: toolbar(
                dimensionChooser({model: model.dimChooserModel}),
                gridCountLabel({gridModel: model.gridModel, unit: 'position'}),
                filler(),
                relativeTimestamp({timestamp: model.loadTimestamp}),
                refreshButton({model, intent: 'success'})
            ),
            ...this.getLayoutProps()
        });
    }
}
export const positionsPanel = elemFactory(PositionsPanel);