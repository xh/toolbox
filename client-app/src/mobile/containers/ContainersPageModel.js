/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {HoistModel} from '@xh/hoist/core';
import {TabContainerModel} from '@xh/hoist/mobile/cmp/tab';

import {hBoxPage} from './HBoxPage';
import {vBoxPage} from './VBoxPage';

@HoistModel()
export class ContainersPageModel {

    tabContainerModel = new TabContainerModel({
        defaultTabId: 'hbox',
        tabs: [
            {
                id: 'hbox',
                pageFactory: hBoxPage,
                label: 'HBox'
            },
            {
                id: 'vbox',
                pageFactory: vBoxPage,
                label: 'VBox'
            }
        ]
    });

}