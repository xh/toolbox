/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {elemFactory, HoistComponent, LayoutSupport} from '@xh/hoist/core/index';
import {filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {grid} from '@xh/hoist/cmp/grid';

@HoistComponent
@LayoutSupport
export class PositionsPanel extends Component {

    render() {
        const {model} = this;

        return panel({
            title: 'Positions',
            icon: Icon.portfolio(),
            mask: model.loadModel,
            sizingModel: model.sizingModel,
            item: grid({model: model.gridModel}),
            bbar: toolbar(
                dimensionChooser({model: model.dimChooserModel}),
                filler(),
                relativeTimestamp({timestamp: model.loadTimestamp}),
                refreshButton({model, intent: 'success'})
            ),
            ...this.getLayoutProps()
        });
    }
}
export const positionsPanel = elemFactory(PositionsPanel);