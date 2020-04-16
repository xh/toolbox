import {box, filler, p} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import {button} from '@xh/hoist/desktop/cmp/button';
import './AppNotificationsPanel.scss';

export const appNotificationsPanel = hoistCmp.factory(
    () => wrapper({
        links: [
            {url: '$HR/svc/EnvironmentService.js', notes: 'EnvironmentService checks for updated versions and alerts after a new release, if enabled.'},
            {url: '$HR/desktop/appcontainer/UpdateBar.js', notes: 'UpdateBar Component'},
            {url: '$HR/svc/IdleService.js', notes: 'Idle Service listens for user interactions and triggers the IdleDialog, if enabled.'},
            {url: '$HR/desktop/appcontainer/IdleDialog.js', notes: 'IdleDialog Component'}
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
            icon: Icon.rocket(),
            items: [
                p(
                    `In the event of an app update, users may continue to browse or complete 
                    actions on their current app version without being interrupted by a sudden 
                    browser refresh.`
                ),
                p(
                    `The server will communicate any version updates to the app and trigger a 
                    banner notification, which will appear at the top of the app's container to 
                    prompt the user to refresh the app.`
                ),
                p(`Click below for a demo of the App Update banner.`),
                filler(),
                button({
                    minimal: false,
                    icon: Icon.bullhorn(),
                    text: 'Release New Toolbox Version 99.0.0',
                    onClick: () => XH.acm.showUpdateBar('99.0.0')
                })
            ]
        });
    }
);

const idleServiceTile = hoistCmp.factory(
    () => {
        return panel({
            title: 'Sleep Mode',
            icon: Icon.moon(),
            items: [
                p(`
                    After a period of inactivity, apps can enter "sleep mode", suspending 
                    background requests and prompting the user to reload the app to resume.
                `),
                p(`
                    This feature is recommended for apps that are rapidly polling or receiving 
                    updates from the server that generate load on back-end APIs.
                `),
                p(`
                    Idle detection is enabled and its time limit configured on a per-app basis.
                `),
                p('Click below to put Toolbox into Sleep Mode.'),
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