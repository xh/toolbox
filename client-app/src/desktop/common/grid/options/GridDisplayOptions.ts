import {AgGridModel} from '@xh/hoist/cmp/ag-grid';
import {GridModel, TreeStyle} from '@xh/hoist/cmp/grid';
import {button} from '@xh/hoist/desktop/cmp/button';
import {select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {sample} from 'lodash';
import {ReactElement} from 'react';
import {wrapperOption} from '../../Wrapper';

/**
 * Standard AG Grid display-option rows (sizing mode + styling switches) for a Wrapper `options`
 * section, bound directly to the supplied `AgGridModel`. Shared by the grid examples.
 *
 * Note: the app-wide Dark Mode toggle is intentionally NOT included here - theme is controlled
 * globally via the app options menu rather than duplicated onto every grid example.
 */
export function agGridDisplayOptions(model: AgGridModel): ReactElement[] {
    return [
        wrapperOption({
            label: 'Sizing Mode',
            control: select({
                model,
                bind: 'sizingMode',
                width: 130,
                enableFilter: false,
                options: [
                    {label: 'Tiny', value: 'tiny'},
                    {label: 'Compact', value: 'compact'},
                    {label: 'Standard', value: 'standard'},
                    {label: 'Large', value: 'large'}
                ]
            })
        }),
        wrapperOption({label: 'Hide Headers', control: switchInput({model, bind: 'hideHeaders'})}),
        wrapperOption({label: 'Striped', control: switchInput({model, bind: 'stripeRows'})}),
        wrapperOption({label: 'Row Borders', control: switchInput({model, bind: 'rowBorders'})}),
        wrapperOption({label: 'Cell Borders', control: switchInput({model, bind: 'cellBorders'})}),
        wrapperOption({label: 'Hover', control: switchInput({model, bind: 'showHover'})}),
        wrapperOption({label: 'Cell Focus', control: switchInput({model, bind: 'showCellFocus'})})
    ];
}

/**
 * Full `GridModel` display-option rows for a Wrapper `options` section: the standard AG Grid styling
 * options plus GridModel-level Tree Style (tree grids only) and empty text. Bound directly to the
 * supplied `GridModel`.
 */
export function gridDisplayOptions(model: GridModel): ReactElement[] {
    return [
        ...agGridDisplayOptions(model.agGridModel),
        ...(model.treeMode
            ? [
                  wrapperOption({
                      label: 'Tree Style',
                      control: select({
                          model,
                          bind: 'treeStyle',
                          width: 180,
                          enableFilter: false,
                          options: [
                              {value: TreeStyle.NONE, label: 'None'},
                              {value: TreeStyle.HIGHLIGHTS, label: 'Highlight Groups'},
                              {value: TreeStyle.COLORS, label: 'Color Groups'},
                              {value: TreeStyle.BORDERS, label: 'Group Borders'},
                              {
                                  value: TreeStyle.HIGHLIGHTS_AND_BORDERS,
                                  label: 'Highlights + Borders'
                              },
                              {value: TreeStyle.COLORS_AND_BORDERS, label: 'Colors + Borders'}
                          ]
                      })
                  })
              ]
            : []),
        wrapperOption({
            label: 'Empty Text',
            control: textInput({model, bind: 'emptyText', width: 140})
        })
    ];
}

/**
 * Selection-demo action buttons (random select + scroll to selection) as full-width buttons for a
 * Wrapper `options` section, bound to the supplied `GridModel`. Historically bundled with the grid
 * display options, kept together here for the grid examples that showcase the selection API.
 */
export function gridDisplayActions(model: GridModel): ReactElement[] {
    return [
        button({
            text: 'Select random record',
            icon: Icon.random(),
            width: '100%',
            onClick: () => {
                const rec = sample(model.store.records);
                if (rec) model.selModel.select(rec);
            }
        }),
        button({
            text: 'Scroll to selection',
            icon: Icon.crosshairs(),
            width: '100%',
            onClick: () => model.ensureSelectionVisibleAsync()
        })
    ];
}
