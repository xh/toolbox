import {clock} from '@xh/hoist/cmp/clock';
import {div, hbox, img, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {ReactElement} from 'react';
import {wrapper, wrapperAction} from '../../common';
// @ts-ignore
import mobileImageDocs from './MobileImageDocs.png';
// @ts-ignore
import mobileImageDocsLight from './MobileImageDocsLight.png';
// @ts-ignore
import mobileImageHome from './MobileImageHome.png';
// @ts-ignore
import mobileImageHomeLight from './MobileImageHomeLight.png';
// @ts-ignore
import mobileImageMenu from './MobileImageMenu.png';
// @ts-ignore
import mobileImageMenuLight from './MobileImageMenuLight.png';
// @ts-ignore
import mobileImageOptions from './MobileImageOptions.png';
// @ts-ignore
import mobileImageOptionsLight from './MobileImageOptionsLight.png';
import './MobileTab.scss';

/** One screen in the mobile feature tour - drives both a nav card and the phone screenshot. */
interface MobileFeature {
    key: string;
    /** Hoist Icon factory result, shown in the card's icon chip. */
    icon: ReactElement;
    /** Card title / nav label. */
    label: string;
    /** One-liner shown on collapsed (inactive) cards. */
    tagline: string;
    /** 2-3 sentence blurb, revealed on the active card. */
    body: string;
    /** Theme-matched captures (frameless app screens) shown in the phone bezel. */
    imgDark: string;
    imgLight: string;
}

// The tour is driven entirely by this array - adding a screen is a single entry here, with no other
// code changes. Each entry pairs advertising copy with the matching light/dark screen captures.
const FEATURES: MobileFeature[] = [
    {
        key: 'dashboard',
        icon: Icon.home(),
        label: 'Customizable Dashboard',
        tagline: 'Home dashboard',
        body:
            'The mobile home screen includes many of the widgets you see here on desktop - ' +
            'with getting started links, live GitHub feeds, and Feedback. Rearrange and ' +
            'collapse to focus on what matters most to you; the layout persists across sessions and devices.',
        imgDark: mobileImageHome,
        imgLight: mobileImageHomeLight
    },
    {
        key: 'options',
        icon: Icon.options(),
        label: 'Rich Examples with Options',
        tagline: 'Forms and option sheets',
        body:
            'Toolbox examples ship with a live options sheet, so you can adjust settings and watch ' +
            'each component respond instantly. Bottom sheets, switches, and segmented controls keep ' +
            'every interaction smooth and natural on touch.',
        imgDark: mobileImageOptions,
        imgLight: mobileImageOptionsLight
    },
    {
        key: 'menu',
        icon: Icon.bars(),
        label: 'Slide-out Navigation',
        tagline: 'Blade navigation menu',
        body:
            'A slide-out navigation blade provides quick access to every section of the app, with ' +
            'collapsible groups, a branded header, and a persistent footer for theme and settings.',
        imgDark: mobileImageMenu,
        imgLight: mobileImageMenuLight
    },
    {
        key: 'docs',
        icon: Icon.book(),
        label: 'In-app Documentation',
        tagline: 'Component docs',
        body:
            'Full component documentation travels with the app, rendered natively on the device. ' +
            'Browse architecture, class hierarchies, and copy-ready code samples without leaving ' +
            'Toolbox or switching to a browser.',
        imgDark: mobileImageDocs,
        imgLight: mobileImageDocsLight
    }
];

/** Tracks which screen of the feature tour is active. */
class MobileTabModel extends HoistModel {
    @bindable selectedIdx = 0;

    get selected(): MobileFeature {
        return FEATURES[this.selectedIdx];
    }

    constructor() {
        super();
        makeObservable(this);
    }
}

export const mobileTab = hoistCmp.factory({
    model: creates(MobileTabModel),
    render({model}) {
        return wrapper({
            title: 'Mobile',
            icon: Icon.mobile(),
            description: [
                'Mobile apps share many of the same components and logic as their desktop',
                'counterparts, with some mobile-specific Hoist components that are supported by',
                'the open-source framework [Onsen](https://onsen.io) to improve the native mobile',
                'UI experience.',
                '',
                'Explore the mobile-web version of Toolbox on your device at',
                '[toolbox.xh.io/mobile](https://toolbox.xh.io/mobile).'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/mobile/MobileTab.ts',
                    notes: 'This example.'
                },
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
            item: featureTour()
        });
    }
});

/**
 * The tour itself: a vertical list of selectable feature cards on the left, and a single phone
 * bezel on the right showing the active screen's capture. Wrapped in a title-less Panel purely for
 * the card-like border around the demo. The active card is the only one expanded (showing its
 * `body` blurb) and is accented in brand orange; clicking a card swaps the phone screenshot.
 */
const featureTour = hoistCmp.factory<MobileTabModel>({
    render({model}) {
        const {darkTheme} = XH;
        return panel({
            className: 'tb-tour-panel',
            item: hbox({
                className: 'tb-tour',
                items: [
                    vbox({
                        className: 'tb-tour__nav',
                        items: [
                            div({className: 'tb-tour__nav-label', item: 'Select a Feature'}),
                            ...FEATURES.map((f, idx) => featureCard(f, idx, model))
                        ]
                    }),
                    div({
                        // `tb-mobile` carries the theme-aware frame vars; the `--light` modifier
                        // recolors the bezel to match the desktop app's theme.
                        className: darkTheme
                            ? 'tb-mobile tb-tour__stage'
                            : 'tb-mobile tb-tour__stage tb-mobile--light',
                        item: phoneFrame(model, darkTheme)
                    })
                ]
            })
        });
    }
});

/** A single selectable feature card: icon chip + title, expanding to its blurb when active. */
function featureCard(f: MobileFeature, idx: number, model: MobileTabModel): ReactElement {
    const active = idx === model.selectedIdx,
        select = () => (model.selectedIdx = idx);
    return div({
        className: active ? 'tb-tour__card tb-tour__card--active' : 'tb-tour__card',
        role: 'button',
        tabIndex: 0,
        onClick: select,
        onKeyDown: e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                select();
            }
        },
        items: [
            div({className: 'tb-tour__chip', item: f.icon}),
            div({
                className: 'tb-tour__card-main',
                items: [
                    div({className: 'tb-tour__card-label', item: f.label}),
                    div({className: 'tb-tour__card-text', item: active ? f.body : f.tagline})
                ]
            }),
            Icon.chevronRight({className: 'tb-tour__card-chev'})
        ]
    });
}

/**
 * Wrap a frameless mobile screen capture in a sleek, modern device frame - a thin dark bezel with
 * a large continuous corner radius, a dynamic-island pill, subtle side buttons, and a soft drop
 * shadow. The screen reserves a top status-bar gap and a bottom home-indicator gap (dark "OS
 * chrome" bands) so the rounded corners clip those bands rather than the app content - mirroring a
 * real device, where the OS chrome keeps content clear of the corners. The source image should be
 * a clean screenshot of just the app screen (no device chrome). The frame's screen slot is tuned to
 * the capture aspect so the shot fills it via `object-fit: cover` with no crop. See MobileTab.scss
 * and the README alongside the screenshots.
 *
 * Every screen's capture (for the current theme) is rendered stacked and stays mounted; only the
 * active one is faded in (opacity, via the `--active` modifier). Toggling opacity on already-mounted
 * (and already-decoded) images gives a smooth cross-fade between screens with no remount, so there
 * is no decode/layout flash on change.
 */
function phoneFrame(model: MobileTabModel, darkTheme: boolean): ReactElement {
    return div({
        className: 'tb-mobile__device',
        items: [
            statusBar(),
            div({
                className: 'tb-mobile__screen',
                item: div({
                    className: 'tb-mobile__shots',
                    items: FEATURES.map((f, idx) =>
                        img({
                            key: f.key,
                            className:
                                idx === model.selectedIdx
                                    ? 'tb-mobile__shot tb-mobile__shot--active'
                                    : 'tb-mobile__shot',
                            src: darkTheme ? f.imgDark : f.imgLight
                        })
                    )
                })
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
