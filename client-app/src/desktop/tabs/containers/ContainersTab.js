/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';

import {HBoxContainerPanel} from './HBoxContainerPanel';
import {VBoxContainerPanel} from './VBoxContainerPanel';
import {ResizableContainerPanel} from './ResizableContainerPanel';
import {TabPanelContainerPanel} from './TabPanelContainerPanel';

@HoistComponent()
export class ContainersTab extends Component {

    localModel = new TabContainerModel({
        route: 'default.containers',
        tabs: [
            {id: 'hbox', title: 'HBox', content: HBoxContainerPanel},
            {id: 'vbox', title: 'VBox', content: VBoxContainerPanel},
            {id: 'resizable', content: ResizableContainerPanel},
            {id: 'tabPanel', title: 'TabPanel', content: TabPanelContainerPanel}
        ]
    });
    
    async loadAsync() {
        this.model.requestRefresh();
    }

    render() {
        return tabContainer({model: this.model, switcherPosition: 'left'});
    }
}
