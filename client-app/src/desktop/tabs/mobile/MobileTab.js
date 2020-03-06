import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {a, hbox, hframe, img, p} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {fontAwesomeIcon, Icon} from '@xh/hoist/icon';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faPhoneLaptop, faMobile} from '@fortawesome/pro-regular-svg-icons';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import './MobileTab.scss';
import mobileImageHome from './MobileImageHome.png';
import mobileImageGrid from './MobileImageGrid.png';
import mobileImageColChooser from './MobileImageColChooser.png';
library.add(faPhoneLaptop, faMobile);

export const mobileTab = hoistCmp.factory(
    () => wrapper({
        description: [
            <p>
                Hoist Components are also the building blocks for mobile apps, with additional native mobile features
                supported by the open source <a href={'http://onsen.io'}>Onsen</a> framework and
                <a href={'https://react-beautiful-dnd.netlify.com/'}><code>react-beautiful-dnd</code></a>. Ag-Grid also
                supports native touch gestures like dragging and tapping for mobile devices.
            </p>,
            <p>
                On mobile, the <code>App</code> component renders Onsen's top-level <code>Navigator</code> component,
                which uses stack management and navigation for the <code>Page</code> component, while on desktop, the
                top-level navigation component is <code>TabContainer</code>, which provides routes to each <code>Tab</code>.
                Another unique feature of Hoist mobile apps is the <code>PinPad</code>, which allows for streamlined
                handling of PIN entry for access.
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
                icon: fontAwesomeIcon({icon: faPhoneLaptop}),
                width: 800,
                height: 540,
                items: [
                    p({
                        items: [
                            'Mobile apps are themeable and also offer a host of app configuration and preference options. ',
                            'Visit Toolbox Mobile by clicking on the button below and using Chrome Dev Tools to simulate ',
                            'a mobile device. Note that Chrome\'s Device Mode has certain limitations and does not yet support ',
                            'certain features like switch inputs. ',
                            'See their website for more information and instructions: ',
                            a({
                                items: [Icon.openExternal(), ' Chrome Dev Tools Device Mode'],
                                href: 'https://developers.google.com/web/tools/chrome-devtools/device-mode#device',
                                target: '_blank'
                            })
                        ]
                    }),
                    button({
                        minimal: false,
                        text: 'Launch Toolbox Mobile Site',
                        icon: fontAwesomeIcon({icon: faMobile}),
                        onClick: () => window.open('/mobile')
                    }),
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
