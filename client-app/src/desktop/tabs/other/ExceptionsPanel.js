import {wrapper} from '../../common';
import {hoistCmp} from '@xh/hoist/core';
import {p} from '@xh/hoist/cmp/layout';

export const exceptionsPanel = hoistCmp.factory(
    () => wrapper({
        description: [p('Exceptions')],
        links: [],
        item: p('Exception')
    })
);