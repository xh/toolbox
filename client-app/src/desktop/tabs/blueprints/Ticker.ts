import {span} from '@xh/hoist/cmp/layout';
import type {ReactNode} from 'react';

/** A symbol's root ticker in bold, with any contract or bond detail, such as `FUT SEP27`, muted. */
export function renderTicker(value: unknown): ReactNode {
    if (value == null) return null;
    const [root, ...rest] = String(value).split(' ');
    return span({
        className: 'tb-ticker',
        items: [
            span({className: 'tb-ticker__root', item: root}),
            rest.length ? span({className: 'tb-ticker__detail', item: ` ${rest.join(' ')}`}) : null
        ]
    });
}
