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

export const treeGridPanel = hoistCmp.factory({
    model: creates(() => new SampleTreeGridModel({includeCheckboxes: false})),
    render({model}) {
        const {gridModel} = model;
        return wrapper({
            title: 'Tree Grid',
            icon: Icon.grid(),
            description: [
                "Hoist's `Grid` renders hierarchical tree data directly, building on ag-Grid's",
                'support for nested data rows. The `GroupingChooser` component lets users control',
                'the tree hierarchy, with optional persistence of their favorite groupings.',
                '',
                'Applications supply standard record data with child nodes nested under their',
                'parents. Aggregations can be provided alongside the data or computed within the',
                'grid via ag-Grid aggregation configs.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/TreeGridPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/grid/README.md',
                    text: 'Grid docs',
                    notes: 'Grid component guide and core concepts.'
                },
                {url: '$HR/cmp/grid/Grid.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/grid/GridModel.ts',
                    notes: 'Hoist model for configuring and interacting with grids, including tree mode.'
                },
                {
                    url: '$HR/desktop/cmp/grouping/GroupingChooser.ts',
                    notes: 'Control for managing the tree grouping hierarchy.'
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
