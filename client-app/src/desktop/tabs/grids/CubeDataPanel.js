import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {grid} from '@xh/hoist/cmp/grid';

import {CubeDataModel} from './CubeDataModel';

@HoistComponent
export class CubeDataPanel extends Component {

    model = new CubeDataModel();

    render() {
        const {model} = this,
            {gridModel} = model;

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
                storeFilterField({gridModel})
            )
        });
    }
}