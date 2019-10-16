import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';

import {wrapper, sampleTreeGrid} from '../../common';

export const TreeGridPanel = hoistCmp(
    () => wrapper({
        description: [
            <p>
                Hoist's Grid supports the display of hierarchical tree data, leveraging the
                underlying support for nested data rows provided by ag-Grid. The <code>DimensionChooser</code> menu
                allows control over the tree hierarchy, and stores the user's recent history for quick access.
                History can also be persisted on the server with <code>XH.prefService()</code>.
            </p>,
            <p>
                Applications provide standard record data with <code>children</code> nodes containing
                their sub-records. Data aggregations may be provided to the grid, or computed
                within the grid via ag-Grid aggregation configs.
            </p>
        ],
        item: panel({
            title: 'Grids › Tree',
            icon: Icon.grid(),
            className: 'tb-grid-wrapper-panel',
            item: sampleTreeGrid({model: {includeCheckboxes: false}})
        })
    })
);