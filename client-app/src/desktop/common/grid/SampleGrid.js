import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler, hbox, hframe, span, vframe} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {colChooserButton, exportButton, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import PT from 'prop-types';
import {gridOptionsPanel} from './options/GridOptionsPanel';
import {SampleGridModel} from './SampleGridModel';
import {capitalize} from 'lodash';
import './SampleGrid.scss';

export const [SampleGrid, sampleGrid] = hoistCmp.withFactory({
    model: uses(SampleGridModel, {createDefault: true}),
    className: 'tbox-samplegrid',
    
    render({model, omitMask, omitGridTools, ...props}) {
        const {selection} = model.gridModel,
            selCount = selection.length;

        let selText;
        switch (selCount) {
            case 0: selText = 'No selection'; break;
            case 1: selText = `Selected ${selection[0].data.company}`; break;

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
                    grid({
                        key: model.gridKey, // needed to trigger re-render when agOptions change
                        agOptions: {
                            groupUseEntireRow: model.groupUseEntireRow,
                            groupMultiAutoColumn: model.groupMultiAutoColumn,
                            autoGroupColumnDef: {
                                headerName: model.groupBy ? 
                                    model.groupBy
                                        .split(',')
                                        .map(it => capitalize(it).replace(/winLose/i, 'Win/Lose'))
                                        .join(' > ') :
                                    null
                            }
                        }
                    }),
                    hbox({
                        items: [Icon.info(), selText],
                        className: 'tbox-samplegrid__selbar'
                    })
                ),
                gridOptionsPanel({model: model.gridModel})
            ),
            tbar: [
                refreshButton(),
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
                switchInput({
                    bind: 'groupUseEntireRow',
                    label: 'Groups Use Entire Row:',
                    labelAlign: 'left',
                    omit: !model.groupBy
                }),
                switchInput({
                    bind: 'groupMultiAutoColumn',
                    label: 'One Column Per Group:',
                    labelAlign: 'left',
                    omit: !model.groupBy || model.groupUseEntireRow
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
     * True to omit the load mask.  Set to true if containing example will handle masking/load indication.
     */
    omitMask: PT.bool
};
