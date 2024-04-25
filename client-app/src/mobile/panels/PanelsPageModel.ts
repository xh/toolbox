import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistModel, managed} from '@xh/hoist/core';
import {panelPage} from './PanelPage';
import {scrollablePanelPage} from './ScrollablePanelPage';

export class PanelsPageModel extends HoistModel {
    @managed
    tabContainerModel: TabContainerModel = new TabContainerModel({
        defaultTabId: 'panel',
        tabs: [
            {
                id: 'panel',
                content: panelPage
            },
            {
                id: 'scrollablePanel',
                content: scrollablePanelPage
            }
        ]
    });
}
