import {tabContainer} from '@xh/hoist/cmp/tab';
import {hbox} from '@xh/hoist/cmp/layout';
import {badge} from '@xh/hoist/cmp/badge';
import {hoistCmp} from '@xh/hoist/core';
import {dashContainerPanel} from './dashContainer/DashContainerPanel';
import {dashCanvasPanel} from './dashcanvas/DashCanvasPanel';
import {dockContainerPanel} from './DockContainerPanel';
import {hboxContainerPanel} from './HBoxContainerPanel';
import {tabPanelContainerPanel} from './tabContainer/TabPanelContainerPanel';
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
                {id: 'dashCanvas', title: hbox('DashCanvas', badge({intent: 'primary', item: 'new'})), content: dashCanvasPanel},
                {id: 'dock', title: 'DockContainer', content: dockContainerPanel},
                {id: 'tileFrame', title: 'TileFrame', content: tileFrameContainerPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
