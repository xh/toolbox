import React from 'react';
import {hoistCmp, XH} from '@xh/hoist/core';
import {a, hbox, hframe, vframe, img, p} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faPhoneLaptop, faMobile} from '@fortawesome/pro-regular-svg-icons';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import mobileImageHome from './MobileImageHome.png';
import mobileImageGrid from './MobileImageGrid.png';
import mobileImageColChooser from './MobileImageColChooser.png';
import './MobileTab.scss';

library.add(faPhoneLaptop, faMobile);

export const mobileTab = hoistCmp.factory(
    () => wrapper({
        description: [
            <p>
                Mobile apps share many of the same components and logic as their desktop counterparts, with some
                mobile-specific Hoist components that are supported by the open source <a href={'http://onsen.io'}>Onsen
                </a> framework to improve the native mobile UI experience. Explore the Toolbox Mobile App on your device
                at <a href={'https://toolbox.xh.io/mobile'}>toolbox.xh.io/mobile</a>.
            </p>
        ],
        item: hbox({
            className: 'tb-mobile',
            items: panel({
                title: 'Mobile Support',
                icon: Icon.icon({iconName: 'phone-laptop'}),
                width: 1000,
                height: 740,
                items: [
                    vframe(
                        button({
                            minimal: false,
                            text: 'Send Link to Toolbox Mobile App',
                            icon: Icon.icon({iconName: 'envelope'}),
                            onClick: () => XH.fetchJson({url: 'emailMobileLink/send'})
                        }),
                        button({
                            minimal: false,
                            text: 'Launch Toolbox Mobile App',
                            icon: Icon.icon({iconName: 'mobile'}),
                            onClick: () => window.open('/mobile')
                        })
                    ),
                    hframe(
                        img({
                            src: mobileImageHome
                        }),
                        img({
                            src: mobileImageGrid
                        }),
                        img({
                            src: mobileImageColChooser
                        })
                    )
                ]
            })
        })
    })
);
