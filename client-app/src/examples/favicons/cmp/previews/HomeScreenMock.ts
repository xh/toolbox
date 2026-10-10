import {div, img, span} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import type {ReactElement} from 'react';
import {FaviconModel} from '../../FaviconModel';

interface OtherApp {
    name: string;
    icon: ReactElement;
    bg: string;
}

/** Neighbouring stand-in apps - our icon takes the slot at `OUR_SLOT`. */
const OTHER_APPS: OtherApp[] = [
    {name: 'Mail', icon: Icon.envelope(), bg: 'linear-gradient(#1e88e5, #1565c0)'},
    {name: 'Calendar', icon: Icon.calendar(), bg: 'linear-gradient(#ef5350, #c62828)'},
    {name: 'Camera', icon: Icon.camera(), bg: 'linear-gradient(#78909c, #37474f)'},
    {name: 'Clock', icon: Icon.clock(), bg: 'linear-gradient(#424242, #121212)'},
    {name: 'Books', icon: Icon.book(), bg: 'linear-gradient(#ffa726, #ef6c00)'},
    {name: 'Phone', icon: Icon.phone(), bg: 'linear-gradient(#66bb6a, #2e7d32)'},
    {name: 'Charts', icon: Icon.chartLine(), bg: 'linear-gradient(#ab47bc, #6a1b9a)'}
];
const OUR_SLOT = 5;

/** The 180px apple touch icon on a phone home screen, among some neighbours. */
export const homeScreenMock = hoistCmp.factory({
    displayName: 'HomeScreenMock',
    model: uses(FaviconModel),

    render({model}) {
        const {appleSvgDataUrl, spec} = model,
            appName = spec.appName || 'My App',
            tiles = OTHER_APPS.map(app =>
                appTile({
                    key: app.name,
                    name: app.name,
                    item: div({
                        className: 'tb-fav-home__glyph',
                        style: {background: app.bg},
                        item: app.icon
                    })
                })
            );

        tiles.splice(
            OUR_SLOT,
            0,
            appTile({
                key: 'ours',
                name: appName,
                isOurs: true,
                item: img({src: appleSvgDataUrl, alt: `${appName} home screen icon`})
            })
        );

        return panel({
            title: 'Home screen',
            icon: Icon.mobile(),
            compactHeader: true,
            className: 'tb-fav-home',
            contentBoxProps: {alignItems: 'center', justifyContent: 'center'},
            items: [
                div({
                    className: 'tb-fav-home__phone',
                    items: [
                        div({
                            className: 'tb-fav-home__status',
                            items: [span('9:41'), span('●●● ▴')]
                        }),
                        div({className: 'tb-fav-home__grid', items: tiles})
                    ]
                })
            ]
        });
    }
});

function appTile({
    key,
    name,
    item,
    isOurs = false
}: {
    key: string;
    name: string;
    item: ReactElement;
    isOurs?: boolean;
}) {
    return div({
        key,
        className: `tb-fav-home__app${isOurs ? ' tb-fav-home__app--ours' : ''}`,
        items: [
            div({className: 'tb-fav-home__tile', item}),
            div({className: 'tb-fav-home__name', item: name})
        ]
    });
}
