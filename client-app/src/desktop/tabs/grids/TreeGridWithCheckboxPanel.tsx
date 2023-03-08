import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {sampleTreeGrid, wrapper} from '../../common';

export const treeGridWithCheckboxPanel = hoistCmp.factory(() =>
    wrapper({
        description: [
            <p>
                This example is a copy of the Tree sample, but adds a checkbox component to every
                node. Custom checkboxes are added via a custom renderer, and the checkboxes values
                are synchronized up and down the tree using the <code>Record</code> API.
            </p>
        ],
        item: panel({
            title: 'Grids › Tree w/CheckBox',
            icon: Icon.grid(),
            className: 'tb-grid-wrapper-panel',
            item: sampleTreeGrid({modelConfig: {includeCheckboxes: true}})
        })
    })
);
