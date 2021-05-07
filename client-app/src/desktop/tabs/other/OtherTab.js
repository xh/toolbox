import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {buttonsPanel} from './Buttons';
import {clockPanel} from './ClockPanel';
import {customPackagePanel} from './CustomPackagePanel';
import {errorMessagePanel} from './ErrorMessagePanel';
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
            switcher: {orientation: 'left'},
            tabs: [
                {id: 'appNotifications', content: appNotificationsPanel},
                {id: 'buttons', content: buttonsPanel},
                {id: 'clock', content: clockPanel},
                {id: 'customPackage', content: customPackagePanel},
                {id: 'dateFormats', content: dateFormatsPanel},
                {id: 'jsx', title: 'Factories vs. JSX', content: jsxPanel},
                {id: 'errorMessage', title: 'ErrorMessage', content: errorMessagePanel},
                {id: 'fileChooser', title: 'FileChooser', content: fileChooserPanel},
                {id: 'icons', content: iconsPanel},
                {id: 'leftRightChooser', title: 'LeftRightChooser', content: leftRightChooserPanel},
                {id: 'numberFormats', content: numberFormatsPanel},
                {id: 'pinPad', title: 'PIN Pad', content: pinPadPanel},
                {id: 'popups', content: popupsPanel},
                {id: 'timestamp', content: relativeTimestampPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
