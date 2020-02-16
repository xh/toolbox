import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {clockPanel} from './ClockPanel';
import {fileChooserPanel} from './FileChooserPanel';
import {dateFormatsPanel} from './formats/DateFormatsPanel';
import {numberFormatsPanel} from './formats/NumberFormatsPanel';
import {iconsPanel} from './IconsPanel';
import {jsxPanel} from './JsxPanel';
import {leftRightChooserPanel} from './LeftRightChooserPanel';
import {popupsPanel} from './PopupsPanel';
import {dialogsPanel} from './dialogs/DialogsPanel';
import {relativeTimestampPanel} from './RelativeTimestampPanel';

export const otherTab = hoistCmp.factory(
    () => tabContainer({
        model: {
            route: 'default.other',
            switcherPosition: 'left',
            tabs: [
                {id: 'dialogs', content: dialogsPanel},
                {id: 'popups', content: popupsPanel},
                {id: 'fileChooser', title: 'FileChooser', content: fileChooserPanel},
                {id: 'leftRightChooser', title: 'LeftRightChooser', content: leftRightChooserPanel},
                {id: 'numberFormats', content: numberFormatsPanel},
                {id: 'dateFormats', content: dateFormatsPanel},
                {id: 'timestamp', content: relativeTimestampPanel},
                {id: 'clock', content: clockPanel},
                {id: 'icons', content: iconsPanel},
                {id: 'jsx', title: 'Factories vs. JSX', content: jsxPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
