import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {hbox, hframe, img, p} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {fontAwesomeIcon, Icon} from '@xh/hoist/icon';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faPhoneLaptop} from '@fortawesome/pro-regular-svg-icons';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import './MobileTab.scss';
import mobileImageHome from './mobileImageHome.png';
import mobileImageGrid from './mobileImageGrid.png';
library.add(faPhoneLaptop);

export const mobileTab = hoistCmp.factory(
    () => wrapper({
        description: [
            <p>
                Hoist Components are also implemented on mobile devices with native mobile features supported by the Onsen framework
                and React Beautiful Drag-and-Drop.
            </p>
        ],
        links: [
            {url: '$HR/mobile/cmp/navigator/Navigator.js', notes: 'Top-level Navigation component for Hoist Mobile apps.'}
        ],
        item: hbox({
            className: 'tb-mobile',
            items: panel({
                title: 'Mobile Support',
                icon: fontAwesomeIcon({icon: faPhoneLaptop}),
                width: 700,
                height: 700,
                margin: 20,
                item: hframe(
                    img({
                        src: mobileImageHome,
                        width: 333,
                        height: 600
                    }),
                    img({
                        src: mobileImageGrid,
                        width: 333,
                        height: 600
                    })
                )
            }),
            bbar: [
                button({
                    text: 'Launch Mobile Site',
                    icon: Icon.openExternal(),
                    onClick: () => window.open('/mobile')
                })
            ]
        })
    })
);
