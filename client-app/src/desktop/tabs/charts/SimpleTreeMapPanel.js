import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common/Wrapper';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {treeMap} from '@xh/hoist/desktop/cmp/treemap';

import {SimpleTreeMapModel} from './SimpleTreeMapModel';

@HoistComponent
export class SimpleTreeMapPanel extends Component {

    model = new SimpleTreeMapModel();

    render() {
        const {model} = this,
            {loadModel, treeMapModel} = model;

        return wrapper(
            panel({
                icon: Icon.gridLarge(),
                title: 'Simple TreeMap',
                mask: loadModel,
                width: 800,
                height: 600,
                item: treeMap({model: treeMapModel})
            })
        );
    }

}