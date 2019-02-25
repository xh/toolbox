import {HoistModel} from '@xh/hoist/core';
import {TabContainerModel} from '@xh/hoist/cmp/tab';

import {HBoxPage} from './HBoxPage';
import {VBoxPage} from './VBoxPage';
import {ToolbarPage} from './ToolbarPage';

@HoistModel
export class ContainersPageModel {

    tabContainerModel = new TabContainerModel({
        defaultTabId: 'hbox',
        tabs: [
            {
                id: 'hbox',
                content: HBoxPage,
                title: 'HBox'
            },
            {
                id: 'vbox',
                content: VBoxPage,
                title: 'VBox'
            },
            {
                id: 'toolbars',
                content: ToolbarPage
            }
        ]
    });
}