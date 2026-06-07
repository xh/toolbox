import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {sampleTreeGrid, wrapper} from '../../common';

export const treeGridWithCheckboxPanel = hoistCmp.factory(() =>
    wrapper({
        title: 'Tree Grid with Checkboxes',
        icon: Icon.grid(),
        description: [
            'This example builds on the Tree Grid, adding a checkbox to every node via a',
            'custom column renderer. Checkbox values are synchronized up and down the',
            'hierarchy using the `StoreRecord` API, so toggling a parent updates its',
            'descendants and a node reflects the state of its children.'
        ],
        links: [
            {
                url: '$TB/client-app/src/desktop/tabs/grids/TreeGridWithCheckboxPanel.ts',
                notes: 'This example.'
            },
            {
                url: '$HR/cmp/grid/README.md',
                text: 'Grid docs',
                notes: 'Grid component guide and core concepts.'
            },
            {
                url: '$HR/cmp/grid/columns/Column.ts',
                notes: 'Column config, including the custom renderer used for the checkboxes.'
            },
            {
                url: '$HR/data/StoreRecord.ts',
                notes: 'Record API used to read and update values across the tree.'
            }
        ],
        item: panel({
            className: 'tb-grid-wrapper-panel',
            item: sampleTreeGrid({modelConfig: {includeCheckboxes: true}})
        })
    })
);
