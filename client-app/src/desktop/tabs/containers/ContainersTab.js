import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {dashContainerPanel} from './dash/DashContainerPanel';
import {dockContainerPanel} from './DockContainerPanel';
import {hboxContainerPanel} from './HBoxContainerPanel';
import {tabPanelContainerPanel} from './TabPanelContainerPanel';
import {tileFrameContainerPanel} from './TileFrameContainerPanel';
import {vboxContainerPanel} from './VBoxContainerPanel';
import './ContainersTab.scss';

export const containersTab = hoistCmp.factory(
    () => tabContainer({
        model: {
            route: 'default.containers',
            switcher: {orientation: 'left'},
            tabs: [
                {id: 'tabPanel', title: 'TabContainer', content: tabPanelContainerPanel},
                {id: 'tileFrame', title: 'TileFrame', content: tileFrameContainerPanel},
                {id: 'dock', title: 'DockContainer', content: dockContainerPanel},
                {id: 'dash', title: 'DashContainer', content: dashContainerPanel},
                {id: 'hbox', title: 'HBox', content: hboxContainerPanel},
                {id: 'vbox', title: 'VBox', content: vboxContainerPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
