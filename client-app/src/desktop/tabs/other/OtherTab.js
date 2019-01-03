import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, TabContainerModel} from '@xh/hoist/desktop/cmp/tab';

import {MaskPanel} from './MaskPanel';
import {LeftRightChooserPanel} from './LeftRightChooserPanel';
import {FileChooserPanel} from './FileChooserPanel';
import {RelativeTimestampPanel} from './RelativeTimestampPanel';
import {JsxPanel} from './JsxPanel';

@HoistComponent
export class OtherTab extends Component {

    model = new TabContainerModel({
        route: 'default.other',
        tabs: [
            {id: 'mask', title: 'Mask', content: MaskPanel},
            {id: 'leftRightChooser', title: 'LeftRightChooser', content: LeftRightChooserPanel},
            {id: 'fileChooser', title: 'FileChooser', content: FileChooserPanel},
            {id: 'timestamp', title: 'Timestamp', content: RelativeTimestampPanel},
            {id: 'jsx', title: 'Factories vs. JSX', content: JsxPanel}
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
