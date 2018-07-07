/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/cmp/tab';

import {HBoxContainerPanel} from './HBoxContainerPanel';
import {VBoxContainerPanel} from './VBoxContainerPanel';
import {ResizableContainerPanel} from './ResizableContainerPanel';
import {TabPanelContainerPanel} from './TabPanelContainerPanel';

@HoistComponent()
export class ContainersTab extends Component {

    localModel = new TabContainerModel({
        route: 'default.containers',
        panes: [
            {id: 'hbox', name: 'HBox', content: HBoxContainerPanel},
            {id: 'vbox', name: 'VBox', content: VBoxContainerPanel},
            {id: 'resizable', content: ResizableContainerPanel},
            {id: 'tabPanel', name: 'TabPanel', content: TabPanelContainerPanel}
        ]
    });
    
    async loadAsync() {
        this.model.requestRefresh();
    }

    render() {
        return tabContainer({model: this.model, switcherPosition: 'left'});
    }
}
