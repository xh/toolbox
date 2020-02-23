import {HoistModel, managed} from '@xh/hoist/core';
import {TabContainerModel} from '@xh/hoist/cmp/tab';

import {hboxPage} from './HBoxPage';
import {vboxPage} from './VBoxPage';
import {toolbarPage} from './ToolbarPage';

@HoistModel
export class ContainersPageModel {

    @managed
    tabContainerModel = new TabContainerModel({
        defaultTabId: 'hbox',
        tabs: [
            {
                id: 'hbox',
                content: hboxPage,
                title: 'HBox'
            },
            {
                id: 'vbox',
                content: vboxPage,
                title: 'VBox'
            },
            {
                id: 'toolbars',
                content: toolbarPage
            }
        ]
    });
}