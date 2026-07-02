import {div, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistProps} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {ReactElement, ReactNode} from 'react';
import './DocsList.scss';

export interface DocsListRowProps extends HoistProps {
    /** Leading glyph (category / source / doc icon). */
    icon: ReactElement;
    title: ReactNode;
    /** Optional muted second line (e.g. a doc description). */
    subtitle?: ReactNode;
    /** Optional trailing count chip (e.g. number of docs in a category). */
    count?: number;
    onClick: () => void;
}

/**
 * Shared drill-down list row for the mobile docs screens (corpus category list + category doc list):
 * leading icon, title with optional subtitle, an optional trailing count, and a chevron. Keeps the
 * two list screens visually identical and DRY.
 */
export const docsListRow = hoistCmp.factory<DocsListRowProps>({
    displayName: 'DocsListRow',

    render({icon, title, subtitle, count, onClick}) {
        return hbox({
            className: 'tb-docs-list__row',
            onClick,
            items: [
                div({className: 'tb-docs-list__row-icon', item: icon}),
                vbox({
                    className: 'tb-docs-list__row-text',
                    items: [
                        div({className: 'tb-docs-list__row-title', item: title}),
                        subtitle
                            ? div({className: 'tb-docs-list__row-subtitle', item: subtitle})
                            : null
                    ]
                }),
                filler(),
                count != null
                    ? span({className: 'tb-docs-list__row-count', item: `${count}`})
                    : null,
                Icon.chevronRight({className: 'tb-docs-list__row-chevron'})
            ]
        });
    }
});
