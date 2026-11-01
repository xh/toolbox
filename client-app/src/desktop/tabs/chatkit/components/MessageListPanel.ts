import {placeholder} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';

// Placeholder - this page is in progress.
export const messageListPanel = hoistCmp.factory({
    displayName: 'MessageListPanel',
    render: () => placeholder(Icon.experiment(), 'This demo is in progress.')
});
