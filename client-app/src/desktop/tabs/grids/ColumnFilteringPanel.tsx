import {creates, hoistCmp} from '@xh/hoist/core';
import {hframe, filler} from '@xh/hoist/cmp/layout';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filterChooser} from '@xh/hoist/desktop/cmp/filter';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {button, colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import React from 'react';

import {ColumnFilteringPanelModel} from './ColumnFilteringPanelModel';
import {wrapper} from '../../common';
import {gridOptionsPanel} from '../../common/grid/options/GridOptionsPanel';

export const columnFilteringPanel = hoistCmp.factory({
    model: creates(ColumnFilteringPanelModel),
    render() {
        return wrapper({
            description: [
                <p>
                    Grids support column-based filtering of their underlying store data. To enable,
                    set the
                    <code>GridModel.filterModel</code> config to a <code>GridFilterModel</code> (or
                    true) and set <code>filterable: true</code> on the columns you wish to filter.
                </p>,
                <p>
                    Applications may also wish to use a <code>FilterChooser</code> to allow the user
                    to filter the store data via a single "omni-box" style text control.
                </p>,
                <p>
                    The example below shows both of these methods being used together on a single
                    store.
                </p>
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/ColumnFilteringPanel.tsx',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/grid/filter/GridFilterModel.ts',
                    notes: 'Hoist model for managed Grid filters.'
                },
                {
                    url: '$HR/cmp/grid/filter/GridFilterFieldSpec.ts',
                    notes: 'FieldSpec for field managed by the GridFilterModel.'
                },
                {
                    url: '$HR/cmp/filter/FilterChooserModel.ts',
                    notes: 'Hoist model for FilterChooser component.'
                },
                {
                    url: '$HR/cmp/filter/FilterChooserFieldSpec.ts',
                    notes: 'FieldSpec for field managed by the FilterChooserModel.'
                }
            ],
            item: panel({
                title: 'Grids › Column Filtering',
                icon: Icon.filter(),
                className: 'tb-grid-wrapper-panel tb-column-filtering-panel',
                tbar: tbar(),
                item: hframe(grid(), gridOptionsPanel()),
                bbar: bbar()
            })
        });
    }
});

const tbar = hoistCmp.factory(() =>
    toolbar(filterChooser({flex: 1, enableClear: true}), storeFilterField())
);

const bbar = hoistCmp.factory<ColumnFilteringPanelModel>(({model}) => {
    const {filterModel} = model.gridModel;
    return toolbar(
        button({
            icon: Icon.filter(),
            text: 'View Grid Filters',
            intent: 'primary',
            onClick: () => filterModel.openDialog()
        }),
        '-',
        switchInput({
            model: filterModel,
            bind: 'commitOnChange',
            label: 'Commit on change'
        }),
        filler(),
        gridCountLabel(),
        colChooserButton(),
        exportButton()
    );
});
