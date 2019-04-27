import {Component} from 'react';
import {XH, HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {select} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {grid} from '@xh/hoist/cmp/grid';
import {filler, hspacer} from '@xh/hoist/cmp/layout';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';

import {CubeDataModel} from './CubeDataModel';

@HoistComponent
export class CubeDataPanel extends Component {

    model = new CubeDataModel();

    render() {
        const {model} = this,
            {gridModel, dimChooserModel} = model;

        return panel({
            mask: model.loadModel,
            item: grid({model: gridModel}),
            tbar: toolbar(
                button({
                    text: 'Reload cube',
                    icon: Icon.gears(),
                    onClick: () => model.loadAsync()
                })
            ),
            bbar: toolbar(
                dimensionChooser({model: dimChooserModel}),
                hspacer(5),
                select({
                    model,
                    bind: 'fundFilter',
                    options: XH.portfolioService.funds,
                    placeholder: 'Filter by fund...'
                }),
                filler(),
                storeFilterField({gridModel})
            )
        });
    }
}