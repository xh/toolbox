import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {HBoxContainerPanel} from './HBoxContainerPanel';
import {VBoxContainerPanel} from './VBoxContainerPanel';
import {PanelContainerPanel} from './PanelContainerPanel';
import {TabPanelContainerPanel} from './TabPanelContainerPanel';
import {ToolbarPanel} from './ToolbarPanel';
import {DockContainerPanel} from './DockContainerPanel';

import './ContainersTab.scss';

@HoistComponent
export class ContainersTab extends Component {
    render() {
        return tabContainer({
            model: {
                route: 'default.containers',
                switcherPosition: 'left',
                tabs: [
                    {id: 'hbox', title: 'HBox', content: HBoxContainerPanel},
                    {id: 'vbox', title: 'VBox', content: VBoxContainerPanel},
                    {id: 'panel', content: PanelContainerPanel},
                    {id: 'tabPanel', title: 'TabContainer', content: TabPanelContainerPanel},
                    {id: 'toolbar', content: ToolbarPanel},
                    {id: 'dock', title: 'DockContainer', content: DockContainerPanel}
                ]
            },
            className: 'toolbox-tab'
        });
    }
}
