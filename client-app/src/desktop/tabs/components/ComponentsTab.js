/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';

import {LeftRightChooserPanel} from './LeftRightChooserPanel';
import {MaskPanel} from './MaskPanel';
import {LoadMaskPanel} from './LoadMaskPanel';
import {ToolbarPanel} from './ToolbarPanel';
import {RelativeTimestampPanel} from './RelativeTimestampPanel';

@HoistComponent()
export class ComponentsTab extends Component {

    localModel = new TabContainerModel({
        route: 'default.components',
        tabs: [
            {id: 'toolbar', content: ToolbarPanel},
            {id: 'leftRightChooser', title: 'LeftRightChooser', content: LeftRightChooserPanel},
            {id: 'showMask', title: 'Mask', content: MaskPanel},
            {id: 'loadMask', title: 'LoadMask', content: LoadMaskPanel},
            {id: 'timestamp', title: 'Timestamp', content: RelativeTimestampPanel}
        ]
    });
    
    async loadAsync() {
        this.model.requestRefresh();
    }

    render() {
        return tabContainer({
            model: this.model,
            switcherPosition: 'left',
            className: 'toolbox-tab'
        });
    }
}
