import {library} from '@fortawesome/fontawesome-svg-core';
import {faPhoneLaptop} from '@fortawesome/pro-regular-svg-icons';
import {filler, hframe, img, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import React from 'react';
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
        description: [
            <p>
                Mobile apps share many of the same components and logic as their desktop
                counterparts, with some mobile-specific Hoist components that are supported by the
                open-source framework{' '}
                <a href="https://onsen.io" target="_blank">
                    Onsen
                </a>{' '}
                to improve the native mobile UI experience. Explore the Toolbox Mobile App on your
                device at{' '}
                <a href="https://toolbox.xh.io/mobile" target="_blank">
                    toolbox.xh.io/mobile
                </a>
                .
            </p>
        ],
        item: panel({
            title: 'Mobile Support',
            icon: Icon.icon({iconName: 'phone-laptop'}),
            className: 'tb-mobile',
            tbar: [
                filler(),
                button({
                    text: 'Mail yourself a link to Toolbox Mobile',
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
                span('or'),
                button({
                    text: 'Open Toolbox Mobile in this browser',
                    icon: Icon.mobile(),
                    minimal: false,
                    onClick: () => XH.openInTab('/mobile')
                }),
                filler()
            ],
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
