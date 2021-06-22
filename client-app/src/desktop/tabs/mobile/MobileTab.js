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
import mobileImageGrid from './MobileImageGrid.png';
import mobileImageHome from './MobileImageHome.png';
import mobileImageColChooser from './MobileImageColChooser.png';

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
        item: hbox({
            className: 'tb-mobile',
            items: panel({
                title: 'Mobile Support',
                icon: Icon.icon({iconName: 'phone-laptop'}),
                width: 1200,
                height: 700,
                items: [
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
                            tooltip: 'Use Chrome Dev Tools to simulate a mobile device.',
                            onClick: () => window.open('/mobile')
                        })
                    ),
                    hframe(
                        <iframe
                            src='https://toolbox.xh.io/mobile'
                            title='iframe-mobile'
                            height='600'
                        />
                        // img({
                        //     src: mobileImageHome
                        // }),
                        // img({
                        //     src: mobileImageGrid
                        // }),
                        // img({
                        //     src: mobileImageColChooser
                        // })
                    )
                ]
            })
        })
    })
);
