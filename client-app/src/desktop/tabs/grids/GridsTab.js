/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';

import {StandardGridPanel} from './StandardGridPanel';
import {GroupedGridPanel} from './GroupedGridPanel';
import {RestGridPanel} from './RestGridPanel';

@HoistComponent()
export class GridsTab extends Component {

    localModel = new TabContainerModel({
        panes: [
            {id: 'standard', content: StandardGridPanel},
            {id: 'grouped', content: GroupedGridPanel},
            {id: 'rest', content: RestGridPanel}
        ]
    });

    render() {
        return tabContainer({model: this.model, switcherPosition: 'left'});
    }
}
