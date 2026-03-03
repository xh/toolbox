import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {filler, hbox, vframe} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {BoxProps, hoistCmp, HoistProps, uses} from '@xh/hoist/core';
import {colAutosizeButton, colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {groupingChooser} from '@xh/hoist/desktop/cmp/grouping';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {gridOptionsPanel} from './options/GridOptionsPanel';
import './SampleGrid.scss';
import {SampleGridModel} from './SampleGridModel';

export interface SampleGridProps extends HoistProps<SampleGridModel>, BoxProps {
    /**
     * True to drop grid-example-specific toolbars/controls - for use when embedding the grid
     * within other examples were such controls would be distracting.
     */
    omitGridTools?: boolean;

    /**
     * True to omit the load mask. Set to true if containing example will handle masking/load
     * indication.
     */
    omitMask?: boolean;
}

export const [SampleGrid, sampleGrid] = hoistCmp.withFactory<SampleGridProps>({
    model: uses(SampleGridModel, {createDefault: true}),
    className: 'tb-sample-grid',

    render({model, omitMask, omitGridTools, ...props}) {
        const {selectedRecords} = model.gridModel,
            selCount = selectedRecords.length;

        let selText;
        switch (selCount) {
            case 0:
                selText = 'No selection';
                break;
            case 1:
                selText = `Selected ${selectedRecords[0].data.company}`;
                break;

            default:
                selText = `Selected ${selCount} companies`;
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
            contentBoxProps: {flexDirection: 'row'},
            items: [
                vframe(
                    grid(),
                    hbox({
                        items: [Icon.info(), selText],
                        className: 'tb-sample-grid__selbar'
                    })
                ),
                gridOptionsPanel({model: model.gridModel})
            ],
            tbar: [
                groupingChooser({icon: Icon.treeList(), emptyText: 'Ungrouped', minWidth: 200}),
                filler(),
                gridCountLabel({unit: 'companies'}),
                '-',
                storeFilterField(),
                '-',
                colAutosizeButton(),
                colChooserButton(),
                exportButton()
            ]
        });
    }
});
