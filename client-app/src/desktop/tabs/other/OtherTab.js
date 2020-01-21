import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {fileChooserPanel} from './FileChooserPanel';
import {iconsPanel} from './IconsPanel';
import {jsxPanel} from './JsxPanel';
import {leftRightChooserPanel} from './LeftRightChooserPanel';
import {relativeTimestampPanel} from './RelativeTimestampPanel';
import {popupsPanel} from './PopupsPanel';
import {clockPanel} from './ClockPanel';

export const otherTab = hoistCmp.factory(
    () => tabContainer({
        model: {
            route: 'default.other',
            switcherPosition: 'left',
            tabs: [
                {id: 'popups', content: popupsPanel},
                {id: 'icons', title: 'Icons', content: iconsPanel},
                {id: 'leftRightChooser', title: 'LeftRightChooser', content: leftRightChooserPanel},
                {id: 'fileChooser', title: 'FileChooser', content: fileChooserPanel},
                {id: 'timestamp', title: 'Timestamp', content: relativeTimestampPanel},
                {id: 'clock', title: 'Clock', content: clockPanel},
                {id: 'jsx', title: 'Factories vs. JSX', content: jsxPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);
