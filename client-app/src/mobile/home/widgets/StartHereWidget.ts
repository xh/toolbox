import {div} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
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
        icon: Icon.grid(),
        title: 'Tour the grids',
        blurb: 'Filtering, grouping, tree data',
        onClick: () => XH.navigate('default.grid')
    },
    {
        icon: Icon.edit(),
        title: 'Explore the forms',
        blurb: 'Model-bound inputs + validation',
        onClick: () => XH.navigate('default.form')
    },
    {
        icon: Icon.book(),
        title: 'Read the docs',
        blurb: 'Core concepts on GitHub',
        onClick: () => XH.openWindow('https://github.com/xh/hoist-react#readme', 'gitlink')
    },
    {
        icon: Icon.code(),
        title: 'Read the source',
        blurb: 'hoist-react + hoist-core',
        onClick: () => XH.openWindow('https://github.com/xh', 'gitlink')
    }
];

/**
 * Mobile Start Here widget - a compact list of jumping-off points, mirroring the desktop widget but
 * routed to the mobile destinations (and to the browser for docs/source, pending an in-app reader).
 */
export const startHereWidget = hoistCmp.factory({
    displayName: 'StartHereWidget',
    render() {
        return div({
            className: 'tb-start-here',
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
