import {creates, hoistCmp} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {
    gridDisplayActions,
    gridDisplayOptions,
    sampleTreeGrid,
    SampleTreeGridModel,
    wrapper,
    wrapperOption
} from '../../common';

export const treeGridWithCheckboxPanel = hoistCmp.factory({
    model: creates(() => new SampleTreeGridModel({includeCheckboxes: true})),
    render({model}) {
        const {gridModel} = model;
        return wrapper({
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
            options: [
                ...gridDisplayOptions(gridModel),
                wrapperOption({
                    label: 'Summary Row',
                    control: select({
                        model: gridModel,
                        bind: 'showSummary',
                        width: 130,
                        enableFilter: false,
                        options: [
                            {label: 'Top Total', value: 'top'},
                            {label: 'Bottom Total', value: 'bottom'},
                            {label: 'No Total', value: false}
                        ]
                    })
                }),
                ...gridDisplayActions(gridModel)
            ],
            item: panel({
                className: 'tb-grid-wrapper-panel',
                item: sampleTreeGrid()
            })
        });
    }
});
