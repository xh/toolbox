/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';

import {DataViewPanel} from './DataViewPanel';
import {LeftRightChooserPanel} from './LeftRightChooserPanel';
import {MaskPanel} from './MaskPanel';
import {LoadMaskPanel} from './LoadMaskPanel';
import {ToolbarPanel} from './ToolbarPanel';

@HoistComponent()
export class ComponentsTab extends Component {

    localModel = new TabContainerModel({
        route: 'default.components',
        panes: [
            {id: 'dataview', name: 'DataView', content: DataViewPanel},
            {id: 'leftRightChooser', name: 'LeftRightChooser', content: LeftRightChooserPanel},
            {id: 'maskPanel', name: 'Mask', content: MaskPanel},
            {id: 'loadMask', name: 'LoadMask', content: LoadMaskPanel},
            {id: 'toolbar', content: ToolbarPanel}
        ]
    });
    
    async loadAsync() {
        this.model.requestRefresh();
    }

    render() {
        return tabContainer({model: this.model, switcherPosition: 'left'});
    }
}
