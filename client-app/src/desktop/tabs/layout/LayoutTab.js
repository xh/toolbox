import {badge} from '@xh/hoist/cmp/badge';
import {hbox} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {dashCanvasPanel} from './dashCanvas/DashCanvasPanel';
import {dashContainerPanel} from './dashContainer/DashContainerPanel';
import {dockContainerPanel} from './DockContainerPanel';
import {hboxContainerPanel} from './HBoxContainerPanel';
import './LayoutTab.scss';
import {tabPanelContainerPanel} from './tabContainer/TabPanelContainerPanel';
import {tileFrameContainerPanel} from './TileFrameContainerPanel';
import {vboxContainerPanel} from './VBoxContainerPanel';

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