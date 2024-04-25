import React from 'react';
import {creates, hoistCmp} from '@xh/hoist/core';
import {hframe, filler, span} from '@xh/hoist/cmp/layout';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {ExternalSortGridPanelModel} from './ExternalSortGridPanelModel';
import {wrapper} from '../../common';
import {gridOptionsPanel} from '../../common/grid/options/GridOptionsPanel';

export const externalSortGridPanel = hoistCmp.factory({
    model: creates(ExternalSortGridPanelModel),
    render() {
        return wrapper({
            description: [
                <p>
                    Grids can optionally manage their sort externally. In the below example, we
                    react to
                    <code>GridModel.sortBy</code> to offload sorting to external logic. Sorted rows
                    can be limited after sorting, facilitating showing a subset of large datasets.
                </p>,
                <p>This pattern could be used to similarly offload sorting to the server.</p>
            ],
            item: panel({
                title: 'Grids › External Sort',
                icon: Icon.gridPanel(),
                className: 'tb-grid-wrapper-panel tb-external-sort-panel',
                mask: 'onLoad',
                tbar: tbar(),
                item: hframe(grid(), gridOptionsPanel())
            })
        });
    }
});

const tbar = hoistCmp.factory<ExternalSortGridPanelModel>(() => {
    return toolbar(
        refreshButton(),
        toolbarSep(),
        span('Max rows:'),
        select({
            bind: 'maxRows',
            options: [
                {value: null, label: 'None'},
                {value: 50, label: '50'},
                {value: 100, label: '100'},
                {value: 500, label: '500'}
            ],
            width: 100,
            enableFilter: false
        }),
        filler(),
        gridCountLabel({unit: 'companies'}),
        storeFilterField(),
        colChooserButton(),
        exportButton()
    );
});
