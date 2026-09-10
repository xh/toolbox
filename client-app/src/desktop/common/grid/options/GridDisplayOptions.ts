import {AgGridModel} from '@xh/hoist/cmp/ag-grid';
import {GridModel, TreeStyle} from '@xh/hoist/cmp/grid';
import {hoistCmp, HoistModel, HoistProps, useLocalModel} from '@xh/hoist/core';
import {select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {sample} from 'lodash';
import {ReactElement} from 'react';
import {wrapperAction, wrapperOption} from '../../Wrapper';

/**
 * Standard grid display-option rows (sizing mode + styling switches) for a Wrapper `options`
 * section, bound directly to the supplied `AgGridModel`. Shared by the grid examples.
 *
 * These styling options are declared on both `GridConfig` and `AgGridModelConfig` (a `GridModel`
 * passes them through to the `AgGridModel` it owns). `configClass` controls which interface the
 * hover disclosure points a developer at: callers driving a higher-level `GridModel` should pass
 * `'GridConfig'` (the config they actually construct), so we don't send them to the underlying
 * `AgGridModel` they never touch directly; the standalone AG Grid example leaves the default.
 *
 * Note: the app-wide Dark Mode toggle is intentionally NOT included here - theme is controlled
 * globally via the app options menu rather than duplicated onto every grid example.
 */
export function agGridDisplayOptions(
    model: AgGridModel,
    configClass: string = 'AgGridModelConfig'
): ReactElement[] {
    return [
        wrapperOption({
            label: 'Sizing Mode',
            propName: `${configClass}.sizingMode`,
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
        wrapperOption({
            label: 'Hide Headers',
            propName: `${configClass}.hideHeaders`,
            control: switchInput({model, bind: 'hideHeaders'})
        }),
        wrapperOption({
            label: 'Striped',
            propName: `${configClass}.stripeRows`,
            control: switchInput({model, bind: 'stripeRows'})
        }),
        wrapperOption({
            label: 'Row Borders',
            propName: `${configClass}.rowBorders`,
            control: switchInput({model, bind: 'rowBorders'})
        }),
        wrapperOption({
            label: 'Cell Borders',
            propName: `${configClass}.cellBorders`,
            control: switchInput({model, bind: 'cellBorders'})
        }),
        wrapperOption({
            label: 'Hover',
            propName: `${configClass}.showHover`,
            control: switchInput({model, bind: 'showHover'})
        }),
        wrapperOption({
            label: 'Cell Focus',
            propName: `${configClass}.showCellFocus`,
            control: switchInput({model, bind: 'showCellFocus'})
        })
    ];
}

/**
 * Full `GridModel` display-option rows for a Wrapper `options` section: the standard styling options
 * plus GridModel-level Tree Style (tree grids only) and empty text. Bound directly to the supplied
 * `GridModel`, with the hover disclosure pointing at `GridConfig` (the config a developer sets up).
 */
export function gridDisplayOptions(model: GridModel): ReactElement[] {
    return [
        ...agGridDisplayOptions(model.agGridModel, 'GridConfig'),
        ...(model.treeMode
            ? [
                  wrapperOption({
                      label: 'Tree Style',
                      propName: 'GridConfig.treeStyle',
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
            propName: 'GridConfig.emptyText',
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
        wrapperAction({
            text: 'Select random record',
            icon: Icon.random(),
            onClick: () => {
                const rec = sample(model.store.records);
                if (rec) model.selModel.select(rec);
            }
        }),
        wrapperAction({
            text: 'Scroll to selection',
            icon: Icon.crosshairs(),
            onClick: () => model.ensureSelectionVisibleAsync()
        })
    ];
}

/** Per-button local state tracking whether the tree is currently fully expanded. */
class ExpandCollapseModel extends HoistModel {
    @bindable accessor expanded = false;
}

/**
 * A toggle action that expands or collapses all rows of a tree `GridModel`. Tracks its own
 * expand/collapse state so a single button can flip between the two.
 */
interface ExpandCollapseButtonProps extends HoistProps {
    gridModel: GridModel;
}

export const expandCollapseButton = hoistCmp.factory<ExpandCollapseButtonProps>({
    displayName: 'ExpandCollapseButton',
    render({gridModel}) {
        const model = useLocalModel(ExpandCollapseModel);
        return wrapperAction({
            text: model.expanded ? 'Collapse all' : 'Expand all',
            icon: model.expanded ? Icon.collapse() : Icon.expand(),
            onClick: () => {
                if (model.expanded) {
                    gridModel.collapseAll();
                } else {
                    gridModel.expandAll();
                }
                model.expanded = !model.expanded;
            }
        });
    }
});
