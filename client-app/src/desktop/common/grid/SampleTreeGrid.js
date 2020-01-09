/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler, hframe} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dimensionChooser} from '@xh/hoist/desktop/cmp/dimensionchooser';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';

import {SampleTreeGridModel} from './SampleTreeGridModel';

import {gridOptionsPanel} from './options/GridOptionsPanel';

export const [SampleTreeGrid, sampleTreeGrid] = hoistCmp.withFactory({

    model: uses(SampleTreeGridModel),

    render({model, ...props}) {
        const {gridModel} = model;
        return panel({
            item: hframe(grid(), gridOptionsPanel({model: gridModel})),
            tbar: [
                refreshButton(),
                toolbarSep(),
                dimensionChooser(),
                filler(),
                gridCountLabel({includeChildren: true}),
                storeFilterField({filterOptions: {includeChildren: model.filterIncludeChildren}}),
                colChooserButton(),
                exportButton()
            ],
            mask: 'onLoad',
            bbar: [
                select({
                    model: gridModel,
                    bind: 'showSummary',
                    width: 130,
                    enableFilter: false,
                    options: [
                        {label: 'Top Total', value: 'top'},
                        {label: 'Bottom Total', value: 'bottom'},
                        {label: 'No Total', value: false}
                    ]
                }),
                toolbarSep(),
                switchInput({
                    bind: 'filterIncludeChildren',
                    label: 'Filter w/Children',
                    labelAlign: 'left'
                })
            ],
            ...props
        });
    }
});

