import {div, hbox, span} from '@xh/hoist/cmp/layout';
import type {ReactElement, ReactNode} from 'react';

/** Shared chrome for the preview cards - a titled, bordered tile within the previews grid. */
export function previewCard({
    title,
    icon,
    className,
    headerItems = [],
    items
}: {
    title: string;
    icon?: ReactElement;
    className?: string;
    headerItems?: ReactNode[];
    items: ReactNode[];
}) {
    return div({
        className: ['tb-fav-card', className].filter(Boolean).join(' '),
        items: [
            hbox({
                className: 'tb-fav-card__header',
                items: [
                    icon ? span({className: 'tb-fav-card__icon', item: icon}) : null,
                    span({className: 'tb-fav-card__title', item: title}),
                    div({className: 'tb-fav-card__header-items', items: headerItems})
                ]
            }),
            div({className: 'tb-fav-card__body', items})
        ]
    });
}
