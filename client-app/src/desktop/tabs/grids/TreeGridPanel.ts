import {p} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {sampleTreeGrid, wrapper} from '../../common';

export const treeGridPanel = hoistCmp.factory(() =>
    wrapper({
        title: 'Tree Grid',
        icon: Icon.grid(),
        description: [
            p(
                "Hoist's Grid renders hierarchical tree data directly, building on ag-Grid's support for nested data rows. The GroupingChooser component lets users control the tree hierarchy, with optional persistence of their favorite groupings."
            ),
            p(
                'Applications supply standard record data with child nodes nested under their parents. Aggregations can be provided alongside the data or computed within the grid via ag-Grid aggregation configs.'
            )
        ],
        links: [
            {
                url: '$TB/client-app/src/desktop/tabs/grids/TreeGridPanel.ts',
                notes: 'This example.'
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
        item: panel({
            className: 'tb-grid-wrapper-panel',
            item: sampleTreeGrid({modelConfig: {includeCheckboxes: false}})
        })
    })
);
