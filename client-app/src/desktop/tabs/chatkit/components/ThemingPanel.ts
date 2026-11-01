import {placeholder} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';

// Placeholder - this page is in progress.
export const themingPanel = hoistCmp.factory({
    displayName: 'ThemingPanel',
    render: () => placeholder(Icon.experiment(), 'This demo is in progress.')
});
