import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {dashContainerPanel} from './dash/DashContainerPanel';
import {dashReportPanel} from './dashreport/DashReportPanel';
import {dockContainerPanel} from './DockContainerPanel';
import {hboxContainerPanel} from './HBoxContainerPanel';
import {tabPanelContainerPanel} from './tab/TabPanelContainerPanel';
import {tileFrameContainerPanel} from './TileFrameContainerPanel';
import {vboxContainerPanel} from './VBoxContainerPanel';
import './LayoutTab.scss';

export const layoutTab = hoistCmp.factory(
    () => tabContainer({
        model: {
            route: 'default.layout',
            switcher: {orientation: 'left'},
            tabs: [
                {id: 'hbox', title: 'HBox', content: hboxContainerPanel},
                {id: 'vbox', title: 'VBox', content: vboxContainerPanel},
                {id: 'tabPanel', title: 'TabContainer', content: tabPanelContainerPanel},
                {id: 'dashContainer', title: 'DashContainer', content: dashContainerPanel},
                {id: 'dashReport', title: 'DashReport', content: dashReportPanel},
                {id: 'dock', title: 'DockContainer', content: dockContainerPanel},
                {id: 'tileFrame', title: 'TileFrame', content: tileFrameContainerPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
