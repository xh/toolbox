import React from 'react';
import {hoistCmp, XH} from '@xh/hoist/core';
import {a, hbox, hframe, img, p} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faPhoneLaptop, faMobile} from '@fortawesome/pro-regular-svg-icons';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import './MobileTab.scss';
import mobileImageHomeDark from './MobileImageHomeDark.PNG';
import mobileImageGrid2 from './MobileImageGrid2.PNG';
import mobileImageColChooser2 from './MobileImageColChooser2.PNG';
library.add(faPhoneLaptop, faMobile);

export const mobileTab = hoistCmp.factory(
    () => wrapper({
        description: [
            <p>
                Mobile apps share many of the same components and logic as their desktop counterparts, with a few differences of
                using mobile-specific Hoist components, supported by the open source <a href={'http://onsen.io'}>Onsen</a> framework
                to improve the native mobile UI experience.
            </p>
        ],
        links: [
            {url: '$HR/mobile/cmp/navigator/Navigator.js', notes: 'Top-level Navigation component for Hoist Mobile apps.'},
            {url: '$HR/mobile/cmp/page/Page.js', notes: 'Page component allows for stack navigation.'}
        ],
        item: hbox({
            className: 'tb-mobile',
            items: panel({
                title: 'Mobile Support',
                icon: Icon.icon({iconName: 'phone-laptop'}),
                width: 1200,
                height: 810,
                items: [
                    // p({
                    //     items: [
                    //         'Mobile apps are themeable and also offer a host of app configuration and preference options. ',
                    //         'Another unique feature of Hoist mobile includes ',
                    //         code('PinPad'),
                    //         ', which provides streamlined handling of PIN entry for access. ',
                    //         'Choose from the buttons below to either receive an email with a link to Toolbox Mobile you ',
                    //         'can open directly on your mobile device, or open Toolbox Mobile in your browser and use Chrome ',
                    //         'Dev Tools to simulate a mobile device. Note that Chrome\'s Device Mode has certain limitations ',
                    //         'and does not yet support certain features like switch inputs. ',
                    //         'See their website for more information and instructions: ',
                    //         a({
                    //             items: [Icon.openExternal(), ' Chrome Dev Tools Device Mode'],
                    //             href: 'https://developers.google.com/web/tools/chrome-devtools/device-mode#device',
                    //             target: '_blank'
                    //         })
                    //     ]
                    // }),
                    hframe(
                        button({
                            minimal: false,
                            text: 'Send Link to Toolbox Mobile App',
                            icon: Icon.icon({iconName: 'envelope'}),
                            width: 'fit-content',
                            onClick: () => XH.fetchJson({url: 'emailMobileLink/send'})
                        }),
                        button({
                            minimal: false,
                            text: 'Launch Toolbox Mobile App',
                            icon: Icon.icon({iconName: 'mobile'}),
                            width: 'fit-content',
                            onClick: () => window.open('/mobile')
                        })
                    ),
                    hframe(
                        img({
                            src: mobileImageHomeDark
                        }),
                        img({
                            src: mobileImageGrid2
                        }),
                        img({
                            src: mobileImageColChooser2
                        })
                    )
                ]
            })
        })
    })
);
