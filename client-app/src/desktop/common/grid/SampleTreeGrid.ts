import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {
    colAutosizeButton,
    colChooserButton,
    expandToLevelButton,
    exportButton,
    refreshButton
} from '@xh/hoist/desktop/cmp/button';
import {gridFindField} from '@xh/hoist/desktop/cmp/grid/find/GridFindField';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {SampleTreeGridModel} from './SampleTreeGridModel';

export const [SampleTreeGrid, sampleTreeGrid] = hoistCmp.withFactory({
    model: uses(SampleTreeGridModel),

    render({model, ...props}) {
        return panel({
            item: grid(),
            ref: model.panelRef,
            tbar: [
                refreshButton({target: model}),
                toolbarSep(),
                groupingChooser(),
                expandToLevelButton(),
                filler(),
                gridCountLabel({includeMode: 'leaves'}),
                '-',
                gridFindField(),
                '-',
                colAutosizeButton(),
                colChooserButton(),
                exportButton()
            ],
            mask: 'onLoad',
            ...props
        });
    }
});
