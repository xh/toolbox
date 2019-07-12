import {tabContainer} from '@xh/hoist/cmp/tab';
import {HoistComponent} from '@xh/hoist/core';
import {Component} from 'react';
import {FileChooserPanel} from './FileChooserPanel';
import {IconsPanel} from './IconsPanel';
import {JsxPanel} from './JsxPanel';
import {LeftRightChooserPanel} from './LeftRightChooserPanel';
import {RelativeTimestampPanel} from './RelativeTimestampPanel';
import {PopupsPanel} from './PopupsPanel';
import {FileManager} from "./filemanager/FileManager";

@HoistComponent
export class OtherTab extends Component {
    render() {
        return tabContainer({
            model: {
                route: 'default.other',
                switcherPosition: 'left',
                tabs: [
                    {id: 'popups', content: PopupsPanel},
                    {id: 'icons', title: 'Icons', content: IconsPanel},
                    {id: 'leftRightChooser', title: 'LeftRightChooser', content: LeftRightChooserPanel},
                    {id: 'fileChooser', title: 'FileChooser', content: FileChooserPanel},
                    {id: 'fileManager', title: 'FileManager', content: FileManager, omit: !XH.getUser().isHoistAdmin},
                    {id: 'timestamp', title: 'Timestamp', content: RelativeTimestampPanel},
                    {id: 'jsx', title: 'Factories vs. JSX', content: JsxPanel},
                ]
            },
            className: 'toolbox-tab'
        });
    }
}
