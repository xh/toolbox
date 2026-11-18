import {placeholder} from '@xh/hoist/cmp/layout';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';

/**
 * Vertical switcher with `TabConfig.group` headers. Grouped tabs are declared contiguously, and
 * `switcher.groups` supplies each header's title and icon.
 */
export const groupsExample = hoistCmp.factory(() =>
    tabContainer({
        className: 'tb-layout-tabs__child',
        switcher: {orientation: 'left'},
        modelConfig: {
            switcher: {
                mode: 'static',
                groups: [
                    {key: 'people', title: 'People', icon: Icon.user()},
                    {key: 'places', title: 'Places', icon: Icon.location()}
                ]
            },
            tabs: [
                {id: 'overview', content: () => placeholder(Icon.info(), 'Overview')},
                {id: 'staff', group: 'people', content: () => placeholder('Staff')},
                {id: 'customers', group: 'people', content: () => placeholder('Customers')},
                {id: 'offices', group: 'places', content: () => placeholder('Offices')},
                {id: 'warehouses', group: 'places', content: () => placeholder('Warehouses')},
                {id: 'settings', content: () => placeholder(Icon.gear(), 'Settings')}
            ]
        }
    })
);
