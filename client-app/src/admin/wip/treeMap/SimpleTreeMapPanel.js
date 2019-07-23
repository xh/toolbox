import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {treeMap} from '@xh/hoist/desktop/cmp/treemap';

import {SimpleTreeMapModel} from './SimpleTreeMapModel';

@HoistComponent
export class SimpleTreeMapPanel extends Component {

    model = new SimpleTreeMapModel();

    render() {
        const {model} = this,
            {loadModel, treeMapModel} = model;

        return panel({
            mask: loadModel,
            item: treeMap({model: treeMapModel})
        });
    }

}