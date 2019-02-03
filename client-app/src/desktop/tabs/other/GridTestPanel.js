import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {numberInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {grid} from '@xh/hoist/cmp/grid';

import {GridTestModel} from './GridTestModel';

@HoistComponent
export class GridTestPanel extends Component {

    model = new GridTestModel();

    render() {
        const {model} = this,
            {gridModel} = model;

        return panel({
            mask: model.loadModel,
            item: grid({
                key: gridModel.xhId,
                model: gridModel
            }),
            bbar: toolbar(
                numberInput({model, bind: 'recordCount'}),
                switchInput({
                    model,
                    bind: 'tree',
                    label: 'Tree',
                    labelAlign: 'left'
                }),
                toolbarSep(),
                refreshButton({model})
            )
        });
    }
}