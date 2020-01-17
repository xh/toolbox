import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {hboxContainerPanel} from './HBoxContainerPanel';
import {vboxContainerPanel} from './VBoxContainerPanel';
import {tabPanelContainerPanel} from './TabPanelContainerPanel';
import {dockContainerPanel} from './DockContainerPanel';
import {dashContainerPanel} from './dash/DashContainerPanel';

import './ContainersTab.scss';

export const containersTab = hoistCmp.factory(
    () => tabContainer({
        model: {
            route: 'default.containers',
            switcherPosition: 'left',
            tabs: [
                {id: 'hbox', title: 'HBox', content: hboxContainerPanel},
                {id: 'vbox', title: 'VBox', content: vboxContainerPanel},
                {id: 'tabPanel', title: 'TabContainer', content: tabPanelContainerPanel},
                {id: 'dock', title: 'DockContainer', content: dockContainerPanel},
                {id: 'dash', title: 'DashContainer', content: dashContainerPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
