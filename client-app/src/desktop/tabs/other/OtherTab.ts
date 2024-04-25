import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {appNotificationsPanel} from './AppNotificationsPanel';
import {buttonsPanel} from './Buttons';
import {clockPanel} from './ClockPanel';
import {customPackagePanel} from './CustomPackagePanel';
import {errorMessagePanel} from './ErrorMessagePanel';
import {exceptionHandlerPanel} from './exceptions/ExceptionHandlerPanel';
import {fileChooserPanel} from './FileChooserPanel';
import {dateFormatsPanel} from './formats/DateFormatsPanel';
import {numberFormatsPanel} from './formats/NumberFormatsPanel';
import {iconsPanel} from './IconsPanel';
import {inspectorPanel} from './InspectorPanel';
import {jsxPanel} from './JsxPanel';
import {leftRightChooserPanel} from './LeftRightChooserPanel';
import {pinPadPanel} from './PinPadPanel';
import {placeholderPanel} from './PlaceholderPanel';
import {popupsPanel} from './PopupsPanel';
import {relativeTimestampPanel} from './relativetimestamp/RelativeTimestampPanel';
import {simpleRoutingPanel} from './routing/SimpleRoutingPanel';

export const otherTab = hoistCmp.factory(() =>
    tabContainer({
        modelConfig: {
            route: 'default.other',
            switcher: {orientation: 'left'},
            tabs: [
                {id: 'appNotifications', content: appNotificationsPanel},
                {id: 'buttons', content: buttonsPanel},
                {id: 'clock', content: clockPanel},
                {id: 'customPackage', content: customPackagePanel},
                {id: 'dateFormats', content: dateFormatsPanel},
                {id: 'errorMessage', title: 'ErrorMessage', content: errorMessagePanel},
                {
                    id: 'exceptionHandler',
                    title: 'Exception Handling',
                    content: exceptionHandlerPanel
                },
                {id: 'jsx', title: 'Factories vs. JSX', content: jsxPanel},
                {id: 'fileChooser', title: 'FileChooser', content: fileChooserPanel},
                {id: 'icons', content: iconsPanel},
                {id: 'inspector', content: inspectorPanel},
                {id: 'leftRightChooser', title: 'LeftRightChooser', content: leftRightChooserPanel},
                {id: 'numberFormats', content: numberFormatsPanel},
                {id: 'pinPad', title: 'PIN Pad', content: pinPadPanel},
                {id: 'placeholder', title: 'Placeholder', content: placeholderPanel},
                {id: 'popups', content: popupsPanel},
                {id: 'timestamp', content: relativeTimestampPanel},
                {id: 'simpleRouting', content: simpleRoutingPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
