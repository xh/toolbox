import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {clockPanel} from './ClockPanel';
import {fileChooserPanel} from './FileChooserPanel';
import {dateFormatsPanel} from './formats/DateFormatsPanel';
import {numberFormatsPanel} from './formats/NumberFormatsPanel';
import {iconsPanel} from './IconsPanel';
import {jsxPanel} from './JsxPanel';
import {leftRightChooserPanel} from './LeftRightChooserPanel';
import {pinPadPanel} from './PinPadPanel';
import {popupsPanel} from './PopupsPanel';
import {relativeTimestampPanel} from './RelativeTimestampPanel';
import {appNotificationsPanel} from './AppNotificationsPanel';

export const otherTab = hoistCmp.factory(
    () => tabContainer({
        model: {
            route: 'default.other',
            switcherPosition: 'left',
            tabs: [
                {id: 'popups', content: popupsPanel},
                {id: 'fileChooser', title: 'FileChooser', content: fileChooserPanel},
                {id: 'leftRightChooser', title: 'LeftRightChooser', content: leftRightChooserPanel},
                {id: 'numberFormats', content: numberFormatsPanel},
                {id: 'dateFormats', content: dateFormatsPanel},
                {id: 'timestamp', content: relativeTimestampPanel},
                {id: 'clock', content: clockPanel},
                {id: 'pinPad', content: pinPadPanel},
                {id: 'icons', content: iconsPanel},
                {id: 'appNotifications', content: appNotificationsPanel},
                {id: 'jsx', title: 'Factories vs. JSX', content: jsxPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
