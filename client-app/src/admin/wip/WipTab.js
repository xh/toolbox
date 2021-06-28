import {placeholder} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';

/**
 * Shell for work-in-progress examples and testing code.
 */
export const wipTab = hoistCmp(() => {
    const tabs = [];

    return tabs.length ?
        tabContainer({model: {route: 'default.wip', switcher: {orientation: 'left'}, tabs}}) :
        placeholder('No WIP projects at the moment...');
});
