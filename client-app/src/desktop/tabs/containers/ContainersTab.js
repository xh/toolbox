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
import {PanelContainerPanel} from './PanelContainerPanel';
import {TabPanelContainerPanel} from './TabPanelContainerPanel';
import {ToolbarPanel} from './ToolbarPanel';

import './ContainersTab.scss';

@HoistComponent()
export class ContainersTab extends Component {

    localModel = new TabContainerModel({
        route: 'default.containers',
        tabs: [
            {id: 'hbox', title: 'HBox', content: HBoxContainerPanel},
            {id: 'vbox', title: 'VBox', content: VBoxContainerPanel},
            {id: 'tabPanel', title: 'TabContainer', content: TabPanelContainerPanel},
            {id: 'panel', content: PanelContainerPanel},
            {id: 'toolbar', content: ToolbarPanel}
        ]
    });

    render() {
        return tabContainer({
            model: this.model,
            switcherPosition: 'left',
            className: 'toolbox-tab'
        });
    }
}
