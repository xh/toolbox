/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';

import {LeftRightChooserPanel} from './LeftRightChooserPanel';
import {MaskPanel} from './MaskPanel';
import {RelativeTimestampPanel} from './RelativeTimestampPanel';
import {JsxPanel} from './JsxPanel';
import {MiscPanel} from './demo/MiscPanel';
import {ExceptionsPanel} from './demo/ExceptionsPanel';
import {MessagesPanel} from './demo/MessagesPanel';

@HoistComponent
export class OtherTab extends Component {

    localModel = new TabContainerModel({
        route: 'default.other',
        tabs: [
            {id: 'mask', title: 'Mask', content: MaskPanel},
            {id: 'leftRightChooser', title: 'LeftRightChooser', content: LeftRightChooserPanel},
            {id: 'timestamp', title: 'Timestamp', content: RelativeTimestampPanel},
            {id: 'jsx', title: 'Factories vs. JSX', content: JsxPanel},
            {id: 'exceptions', title: 'Exception Handling', content: ExceptionsPanel},
            {id: 'messages', title: 'Messages/Toasts', content: MessagesPanel},
            {id: 'misc', title: 'Misc', content: MiscPanel}
        ]
    });
    
    async loadAsync() {
        this.model.requestRefresh();
    }

    render() {
        return tabContainer({
            model: this.model,
            switcherPosition: 'left',
            className: 'toolbox-tab'
        });
    }
}
