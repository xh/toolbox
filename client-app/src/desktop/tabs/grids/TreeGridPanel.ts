import {code, p} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {sampleTreeGrid, wrapper} from '../../common';

export const treeGridPanel = hoistCmp.factory(() =>
    wrapper({
        description: [
            p(
                'Hoist\'s Grid supports the display of hierarchical tree data, leveraging the underlying support for nested data rows provided by ag-Grid. The ',
                code('GroupingChooser'),
                ' component allows control over the tree hierarchy, with optional support for persisting user-driven favorites.'
            ),
            p(
                'Applications provide standard record data with ',
                code('children'),
                ' nodes containing their sub-records. Data aggregations may be provided to the grid, or computed within the grid via ag-Grid aggregation configs.'
            )
        ],
        item: panel({
            title: 'Grids › Tree',
            icon: Icon.grid(),
            className: 'tb-grid-wrapper-panel',
            item: sampleTreeGrid({modelConfig: {includeCheckboxes: false}})
        })
    })
);
