import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {expandCollapseButton, sampleTreeGrid, SampleTreeGridModel, wrapper} from '../../common';

export const treeGridWithCheckboxPanel = hoistCmp.factory({
    model: creates(() => new SampleTreeGridModel({includeCheckboxes: true})),
    render({model}) {
        const {gridModel} = model;
        return wrapper({
            title: 'Tree Grid with Checkboxes',
            icon: Icon.treeList(),
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
            options: [expandCollapseButton({gridModel})],
            item: panel({
                className: 'tb-grid-wrapper-panel',
                item: sampleTreeGrid()
            })
        });
    }
});
