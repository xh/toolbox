import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler, hframe} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {hoistCmp, uses} from '@xh/hoist/core';
import {
    colChooserButton,
    expandToLevelButton,
    exportButton,
    refreshButton
} from '@xh/hoist/desktop/cmp/button';
import {gridFindField} from '@xh/hoist/desktop/cmp/grid/find/GridFindField';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {gridOptionsPanel} from './options/GridOptionsPanel';
import {SampleTreeGridModel} from './SampleTreeGridModel';

export const [SampleTreeGrid, sampleTreeGrid] = hoistCmp.withFactory({
    model: uses(SampleTreeGridModel),

    render({model, ...props}) {
        const {gridModel} = model;
        return panel({
            item: hframe(grid(), gridOptionsPanel({model: gridModel})),
            ref: model.panelRef,
            tbar: [
                refreshButton({target: model}),
                toolbarSep(),
                groupingChooser(),
                expandToLevelButton(),
                filler(),
                gridCountLabel({
                    includeChildren: true,
                    excludeParents: true
                }),
                storeFilterField(),
                '-',
                gridFindField(),
                '-',
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
                })
            ],
            ...props
        });
    }
});
