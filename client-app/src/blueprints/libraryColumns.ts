import type {BlueprintSummary} from '@xh/hoist-chat-kit/blueprint';
import {badge} from '@xh/hoist/cmp/badge';
import {div, hbox} from '@xh/hoist/cmp/layout';
import {XH} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import type {ReactNode} from 'react';

/** The library's groups, in the order it shows them. */
export const LIBRARY_GROUPS = ['Yours', 'Shared with you', 'Examples'];

/** The owner of the blueprints the server seeds, which the library shows as examples. */
export const SEED_OWNER = 'toolbox';

export function libraryGroup(s: BlueprintSummary): string {
    if (s.owner === XH.getUsername()) return 'Yours';
    return s.owner === SEED_OWNER ? 'Examples' : 'Shared with you';
}

/** A library row's name, over its description's first line. */
export function libraryName(name: string, description: string): ReactNode {
    return div({
        className: 'tb-library__name',
        items: [
            div({className: 'tb-library__title', item: name}),
            description
                ? div({className: 'tb-library__desc', item: description.split('\n')[0]})
                : null
        ]
    });
}

/** A library row's status: its draft and latest publish, and a lock where the user only reads. */
export function libraryStatus(row: PlainObject): ReactNode {
    const {draftVersion, publishedVersion, readOnly} = row;
    return hbox({
        className: 'tb-library__status',
        items: [
            draftVersion ? badge({intent: 'primary', item: `Draft v${draftVersion}`}) : null,
            publishedVersion
                ? badge({
                      intent: 'success',
                      icon: readOnly ? Icon.lock() : null,
                      item: `Published v${publishedVersion}`
                  })
                : null
        ]
    });
}
