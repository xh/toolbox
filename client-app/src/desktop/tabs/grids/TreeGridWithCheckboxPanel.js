import React from 'react';
import {hoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';

import {wrapper, sampleTreeWithCheckboxGrid} from '../../common';

export const TreeGridWithCheckboxPanel = hoistComponent(
    () => wrapper({
        description: [
            <p>
                This example is a copy of the Tree sample, but adds a checkbox component to every node via the treeColumn's "innerRendererFramework" property.
            </p>
        ],
        item: panel({
            title: 'Grids › Tree w/CheckBox',
            icon: Icon.grid(),
            width: 900,
            height: 500,
            item: sampleTreeWithCheckboxGrid()
        })
    })
);