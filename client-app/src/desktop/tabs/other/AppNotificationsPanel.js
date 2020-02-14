import {box, p, filler} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import {button} from '@xh/hoist/desktop/cmp/button';
import {XH} from '@xh/hoist/core';
import './AppNotificationsPanel.scss';

export const appNotificationsPanel = hoistCmp.factory(
    () => wrapper({
        links: [
            {url: '$HR/desktop/appcontainer/UpdateBar.js', notes: 'Update Bar Component'},
            {url: '$HR/svc/IdleService.js', notes: 'Idle Service'},
            {url: '$HR/desktop/appcontainer/IdleDialog.js', notes: 'Idle Dialog Component'}
        ],
        item: box({
            className: 'tb-app-notifications',
            items: [
                updateBarTile(),
                idleServiceTile()
            ]
        })
    })
);

const updateBarTile = hoistCmp.factory(
    () => {
        return panel({
            title: 'App Update',
            icon: Icon.bolt(),
            className: 'tb-update',
            items: [
                p('In the event of an app update, users may continue to browse or complete actions on their current app' +
                    ' version without being interrupted by a sudden browser refresh.'),
                p('The server will communicate any version updates to the app and trigger a banner notification' +
                    ', which will appear at the top of the app\'s container to prompt the user to refresh the app.'),
                p('Click on the button below for a demo of the App Update banner.'),
                filler(),
                button({
                    minimal: false,
                    icon: Icon.bullhorn(),
                    text: 'Release New Toolbox Version 3.0',
                    onClick: () => XH.acm.showUpdateBar('Toolbox Version 3.0')
                })
            ]
        });
    }
);

const idleServiceTile = hoistCmp.factory(
    () => {
        return panel({
            title: 'Sleep Mode',
            className: 'tb-idle',
            icon: Icon.moon(),
            items: [
                p('After a period of inactivity, the app will enter "sleep mode", suspending background requests.'),
                p('The app will notify and prompt the user to reload the app. Any unsaved actions will be lost.'),
                p('Idle session monitoring and the length of time can be specified by the admin config. ' +
                    'This Toolbox, for example, goes idle after 15 minutes of inactivity.'),
                p('Click on the button below for a demo of the Sleep Mode notification.'),
                filler(),
                button({
                    minimal: false,
                    className: 'tb-idle__button',
                    icon: Icon.userClock(),
                    text: 'Enter Sleep Mode',
                    onClick: () => XH.idleService.suspendApp()
                })
            ]
        });
    }
);