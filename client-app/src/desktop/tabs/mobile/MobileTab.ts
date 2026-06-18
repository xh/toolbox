import {library} from '@fortawesome/fontawesome-svg-core';
import {faPhoneLaptop} from '@fortawesome/pro-regular-svg-icons';
import {clock} from '@xh/hoist/cmp/clock';
import {div, hbox, img, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {wrapper, wrapperAction} from '../../common';
// @ts-ignore
import mobileImageForm from './MobileImageForm.png';
// @ts-ignore
import mobileImageFormLight from './MobileImageFormLight.png';
// @ts-ignore
import mobileImageHome from './MobileImageHome.png';
// @ts-ignore
import mobileImageHomeLight from './MobileImageHomeLight.png';
import './MobileTab.scss';

library.add(faPhoneLaptop);

export const mobileTab = hoistCmp.factory(() => {
    // Track the desktop app's theme: pick matching light/dark screen captures and flag the frame
    // (which recolors via the `--light` modifier in MobileTab.scss). `XH.darkTheme` is observable,
    // so this re-renders when the user toggles the theme.
    const {darkTheme} = XH,
        homeImage = darkTheme ? mobileImageHome : mobileImageHomeLight,
        formImage = darkTheme ? mobileImageForm : mobileImageFormLight;
    return wrapper({
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
            wrapperAction({
                text: 'Mail yourself a link',
                icon: Icon.envelope(),
                intent: 'primary',
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
            wrapperAction({
                text: 'Open in this browser',
                icon: Icon.mobile(),
                onClick: () => XH.openWindow('/mobile')
            })
        ],
        // The two device-framed screenshots float directly on the wrapper's tiled background (no
        // surrounding card) - each phone is self-framed, so the demo region just centers the pair
        // and the XH monogram shows around them. `tb-mobile` carries the theme-aware frame vars.
        item: hbox({
            className: darkTheme
                ? 'tb-mobile tb-mobile__screenshots'
                : 'tb-mobile tb-mobile__screenshots tb-mobile--light',
            items: [phoneFrame(homeImage), phoneFrame(formImage)]
        })
    });
});

/**
 * Wrap a frameless mobile screen capture in a sleek, modern device frame - a thin dark bezel with
 * a large continuous corner radius, a dynamic-island pill, subtle side buttons, and a soft drop
 * shadow. The screen reserves a top status-bar gap and a bottom home-indicator gap (dark "OS
 * chrome" bands) so the rounded corners clip those bands rather than the app content - mirroring a
 * real device, where the OS chrome keeps content clear of the corners. The source image should be
 * a clean screenshot of just the app screen (no device chrome) at a ~9:19.5 phone aspect ratio; it
 * crops to fit via `object-fit: cover`. See MobileTab.scss and the README alongside the screenshots.
 */
function phoneFrame(src: string) {
    return div({
        className: 'tb-mobile__device',
        items: [
            statusBar(),
            div({
                className: 'tb-mobile__screen',
                item: img({className: 'tb-mobile__shot', src})
            }),
            div({className: 'tb-mobile__home'})
        ]
    });
}

/**
 * A faux iOS-style status bar drawn into the top chrome gap: a clock at left and, at right, a cute
 * "XH mobile" carrier label beside a CSS signal-strength meter and a battery glyph. Purely
 * decorative - it fills the top band so the framed screenshot doesn't read as oddly cropped.
 */
function statusBar() {
    return div({
        className: 'tb-mobile__statusbar',
        items: [
            // Real system time via Hoist's `clock`, styled to match. iOS-style `h:mm`, ticking
            // every few seconds (the minutes display only needs a coarse refresh).
            clock({className: 'tb-mobile__clock', format: 'h:mm', updateInterval: 5 * SECONDS}),
            div({
                className: 'tb-mobile__status-right',
                items: [
                    div({
                        className: 'tb-mobile__signal',
                        items: [0, 1, 2, 3].map(i => div({key: i, className: 'tb-mobile__bar'}))
                    }),
                    span({className: 'tb-mobile__carrier', item: 'XH mobile'}),
                    div({
                        className: 'tb-mobile__battery',
                        item: div({className: 'tb-mobile__battery-fill'})
                    })
                ]
            })
        ]
    });
}
