import {box, filler, p} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';

import './AppNotificationsPanel.scss';
import {wrapper} from '../../common';

export const appNotificationsPanel = hoistCmp.factory(() =>
    wrapper({
        title: 'App Notifications',
        icon: Icon.rocket(),
        description: p(
            "Hoist surfaces important runtime events without interrupting the user's work. The framework detects new app versions and prompts for a refresh via an unobtrusive banner, and can suspend an idle session to reduce server load before prompting the user to reload. The two tiles below trigger each behavior on demand."
        ),
        links: [
            {
                url: '$TB/client-app/src/desktop/tabs/other/AppNotificationsPanel.ts',
                notes: 'This example.'
            },
            {
                url: '$HR/svc/README.md',
                text: 'Services docs',
                notes: 'Built-in services guide.'
            },
            {
                url: '$HR/svc/EnvironmentService.ts',
                notes: 'Checks for updated versions and alerts after a new release, if enabled.'
            },
            {
                url: '$HR/svc/IdleService.ts',
                notes: 'Listens for user interactions and triggers the IdlePanel, if enabled.'
            },
            {
                url: '$HR/desktop/appcontainer/suspend/IdlePanel.ts',
                notes: 'Panel shown when an idle session is suspended.'
            }
        ],
        item: box({
            className: 'tb-app-notifications',
            items: [bannerTile(), idleServiceTile()]
        })
    })
);

const bannerTile = hoistCmp.factory(() =>
    panel({
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
            p(`Click below to show the App Update Banner.`),
            filler()
        ],
        bbar: [
            button({
                minimal: false,
                flex: 1,
                margin: '0 10px',
                icon: Icon.rocket(),
                text: 'Release New Toolbox Version 99.0.0',
                onClick: () => XH.appContainerModel.showUpdateBanner('99.0.0')
            })
        ]
    })
);

const idleServiceTile = hoistCmp.factory(() =>
    panel({
        title: 'Idle Detection',
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
            p('Idle detection is enabled and configured via the xhIdleConfig app config.'),
            p('Click below to put Toolbox to sleep.'),
            filler()
        ],
        bbar: [
            button({
                minimal: false,
                flex: 1,
                margin: '0 10px',
                className: 'tb-idle__button',
                icon: Icon.moon(),
                text: 'Enter Sleep Mode',
                onClick: () => XH.suspendApp({reason: 'IDLE'})
            })
        ]
    })
);
