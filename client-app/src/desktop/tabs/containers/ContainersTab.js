import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {dashContainerPanel} from './dash/DashContainerPanel';
import {dashGridLayoutContainerPanel} from './dashGrid/DashGridLayoutContainerPanel';
import {dockContainerPanel} from './DockContainerPanel';
import {hboxContainerPanel} from './HBoxContainerPanel';
import {tabPanelContainerPanel} from './tab/TabPanelContainerPanel';
import {tileFrameContainerPanel} from './TileFrameContainerPanel';
import {vboxContainerPanel} from './VBoxContainerPanel';
import './ContainersTab.scss';

export const containersTab = hoistCmp.factory(
    () => tabContainer({
        model: {
            route: 'default.containers',
            switcher: {orientation: 'left'},
            tabs: [
                {id: 'hbox', title: 'HBox', content: hboxContainerPanel},
                {id: 'vbox', title: 'VBox', content: vboxContainerPanel},
                {id: 'tabPanel', title: 'TabContainer', content: tabPanelContainerPanel},
                {id: 'dash', title: 'DashContainer', content: dashContainerPanel},
                {id: 'dashGrid', title: 'DashGridLayoutContianer', content: dashGridLayoutContainerPanel},
                {id: 'dock', title: 'DockContainer', content: dockContainerPanel},
                {id: 'tileFrame', title: 'TileFrame', content: tileFrameContainerPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
