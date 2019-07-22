import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {treeMap} from '@xh/hoist/desktop/cmp/treemap';

import {TreeMapPanelModel} from './TreeMapPanelModel';

@HoistComponent
export class TreeMapPanel extends Component {

    model = new TreeMapPanelModel();

    render() {
        const {model} = this,
            {loadModel, treeMapModel} = model;

        return panel({
            mask: loadModel,
            item: treeMap({model: treeMapModel})
        });
    }

}