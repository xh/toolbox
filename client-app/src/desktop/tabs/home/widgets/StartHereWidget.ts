import {div} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {ReactElement} from 'react';
import './StartHereWidget.scss';

interface StartHereItem {
    icon: ReactElement;
    title: string;
    blurb: string;
    onClick: () => void;
}

const ITEMS: StartHereItem[] = [
    {
        icon: Icon.book(),
        title: 'New to Hoist? Start with the docs',
        blurb: 'Core concepts, components, and patterns - searchable right here in Toolbox.',
        onClick: () => XH.navigate('default.docs')
    },
    {
        icon: Icon.grid(),
        title: 'Tour the grids',
        blurb: "Backed by Hoist's observable data Stores - filtering, grouping, tree data, inline editing, and more.",
        onClick: () => XH.navigate('default.grids')
    },
    {
        icon: Icon.rocket(),
        title: 'Browse the example apps',
        blurb: 'Complete mini-apps - portfolio, weather, contacts, news, and more.',
        onClick: () => XH.navigate('default.examples')
    },
    {
        icon: Icon.code(),
        title: 'Read the source',
        blurb: 'hoist-react and hoist-core on GitHub - the client and server libraries behind this app.',
        onClick: () => XH.openWindow('https://github.com/xh', 'gitlink')
    },
    {
        icon: Icon.terminal(),
        title: 'Run it locally',
        blurb: 'Clone Toolbox and have the full stack running on your machine in minutes.',
        onClick: () =>
            XH.openWindow(
                'https://github.com/xh/toolbox/blob/develop/docs/running-locally.md',
                'gitlink'
            )
    }
];

export const startHereWidget = hoistCmp.factory({
    displayName: 'StartHereWidget',
    render() {
        return panel({
            className: 'tb-start-here',
            scrollable: true,
            // Make the panel's own (scrolling) content box the flex column for our items,
            // avoiding an extra wrapper layer.
            contentBoxProps: {display: 'flex', className: 'tb-start-here__items'},
            items: ITEMS.map(it =>
                div({
                    className: 'tb-start-here__item',
                    key: it.title,
                    onClick: it.onClick,
                    items: [
                        div({className: 'tb-start-here__item-icon', item: it.icon}),
                        div({
                            className: 'tb-start-here__item-text',
                            items: [
                                div({className: 'tb-start-here__item-title', item: it.title}),
                                div({className: 'tb-start-here__item-blurb', item: it.blurb})
                            ]
                        }),
                        Icon.chevronRight({className: 'tb-start-here__item-caret'})
                    ]
                })
            )
        });
    }
});
