import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler, hbox, hframe, span, vframe} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {hoistCmp, uses} from '@xh/hoist/core';
import {colAutosizeButton, colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import PT from 'prop-types';
import {gridOptionsPanel} from './options/GridOptionsPanel';
import './SampleGrid.scss';
import {SampleGridModel} from './SampleGridModel';

export const [SampleGrid, sampleGrid] = hoistCmp.withFactory({
    model: uses(SampleGridModel, {createDefault: true}),
    className: 'tb-sample-grid',

    render({model, omitMask, omitGridTools, ...props}) {
        const {selectedRecords} = model.gridModel,
            selCount = selectedRecords.length;

        let selText;
        switch (selCount) {
            case 0: selText = 'No selection'; break;
            case 1: selText = `Selected ${selectedRecords[0].data.company}`; break;

            default: selText = `Selected ${selCount} companies`;
        }

        if (omitGridTools) {
            return panel({
                ref: model.panelRef,
                mask: omitMask ? null : 'onLoad',
                item: grid(),
                ...props
            });
        }

        return panel({
            ref: model.panelRef,
            mask: omitMask ? null : 'onLoad',
            ...props,
            item: hframe(
                vframe(
                    grid(),
                    hbox({
                        items: [Icon.info(), selText],
                        className: 'tb-sample-grid__selbar'
                    })
                ),
                gridOptionsPanel({model: model.gridModel})
            ),
            tbar: [
                refreshButton(),
                colAutosizeButton(),
                toolbarSep(),
                span('Group by:'),
                select({
                    bind: 'groupBy',
                    options: [
                        {value: 'city', label: 'City'},
                        {value: 'winLose', label: 'Win/Lose'},
                        {value: 'city,winLose', label: 'City › Win/Lose'},
                        {value: 'winLose,city', label: 'Win/Lose › City'},
                        {value: false, label: 'None'}
                    ],
                    width: 160,
                    enableFilter: false
                }),
                filler(),
                gridCountLabel({unit: 'companies'}),
                storeFilterField(),
                colChooserButton(),
                exportButton()
            ]
        });
    }
});

SampleGrid.propTypes = {
    /**
     * True to drop grid-example-specific toolbars/controls - for use when embedding the grid
     * within other examples where such controls would be distracting.
     */
    omitGridTools: PT.bool,

    /**
     * True to omit the load mask.  Set to true if containing example will handle masking/load
     * indication.
     */
    omitMask: PT.bool
};
