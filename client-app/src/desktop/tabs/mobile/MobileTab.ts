import {library} from '@fortawesome/fontawesome-svg-core';
import {faPhoneLaptop} from '@fortawesome/pro-regular-svg-icons';
import {hframe, img} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common';
// @ts-ignore
import mobileImageForm from './MobileImageForm.png';
// @ts-ignore
import mobileImageGrid from './MobileImageGrid.png';
// @ts-ignore
import mobileImageHome from './MobileImageHome.png';
import './MobileTab.scss';

library.add(faPhoneLaptop);

export const mobileTab = hoistCmp.factory(() =>
    wrapper({
        title: 'Mobile',
        icon: Icon.mobile(),
        description: [
            'Mobile apps share many of the same components and logic as their desktop',
            'counterparts, with some mobile-specific Hoist components that are supported by',
            'the open-source framework [Onsen](https://onsen.io) to improve the native mobile',
            'UI experience. Explore the Toolbox Mobile App on your device at',
            '[toolbox.xh.io/mobile](https://toolbox.xh.io/mobile).'
        ],
        links: [
            {url: '$TB/client-app/src/desktop/tabs/mobile/MobileTab.ts', notes: 'This example.'},
            {
                url: '$HR/mobile/README.md',
                text: 'Mobile docs',
                notes: 'Mobile components guide.'
            },
            {
                url: 'https://toolbox.xh.io/mobile',
                text: 'Toolbox Mobile',
                notes: 'The live Toolbox mobile app, best viewed on a device.'
            },
            {
                url: '$HR/mobile',
                text: 'Mobile package',
                notes: 'Mobile-specific Hoist components.'
            },
            {
                url: 'https://onsen.io',
                text: 'Onsen UI',
                notes: 'The underlying mobile UI framework.'
            }
        ],
        options: [
            button({
                text: 'Mail yourself a link',
                icon: Icon.envelope(),
                intent: 'primary',
                minimal: false,
                onClick: () => {
                    XH.fetch({url: 'emailMobileLink/send'});
                    XH.toast({
                        icon: Icon.mail(),
                        message:
                            'Sent a link to your email address - open and launch on your phone.',
                        timeout: 10000
                    });
                }
            }),
            button({
                text: 'Open in this browser',
                icon: Icon.mobile(),
                minimal: false,
                onClick: () => XH.openWindow('/mobile')
            })
        ],
        item: panel({
            className: 'tb-mobile',
            item: hframe({
                className: 'tb-mobile__screenshots',
                items: [
                    img({src: mobileImageHome}),
                    img({src: mobileImageGrid}),
                    img({src: mobileImageForm})
                ]
            })
        })
    })
);
