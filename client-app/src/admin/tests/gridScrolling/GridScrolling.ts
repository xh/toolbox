import {form} from '@xh/hoist/cmp/form';
import {grid} from '@xh/hoist/cmp/grid';
import {div, hbox, hframe, span} from '@xh/hoist/cmp/layout';
import type {HoistProps} from '@xh/hoist/core';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {checkbox, numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSeparator} from '@xh/hoist/desktop/cmp/toolbar';
import {AgGridReact} from 'ag-grid-react';
import {upperFirst} from 'lodash';
import {createElement} from 'react';
import {GRID_SIZING, GridScrollingModel} from './GridScrollingModel';
import type {ScrollResult, ScrollTarget} from './GridScrollingModel';

export const gridScrolling = hoistCmp.factory({
    model: creates(GridScrollingModel),

    render({model}) {
        return panel({
            tbar: tbar(),
            // Keyed so both grids remount when Apply rebuilds them - see `gridGeneration`.
            item: hframe(
                panel({
                    flex: 1,
                    item: grid({
                        key: model.gridGeneration,
                        ref: model.hoistGridRef
                    }),
                    bbar: scrollBar({grid: 'hoist'})
                }),
                panel({
                    flex: 1,
                    item: div({
                        ref: model.agGridRef,
                        style: {flex: 1},
                        item: createElement(AgGridReact, {
                            key: model.gridGeneration,
                            rowData: model.rowData,
                            columnDefs: model.agColumnDefs,
                            rowHeight: GRID_SIZING.rowHeight,
                            headerHeight: GRID_SIZING.headerHeight,
                            suppressColumnVirtualisation: !model.isColVirtualizationEnabled,
                            animateRows: false
                        })
                    }),
                    bbar: scrollBar({grid: 'ag'})
                })
            )
        });
    }
});

const tbar = hoistCmp.factory(() =>
    toolbar({
        // Items that do not fit move into a menu, so a narrow window can still reach them.
        enableOverflowMenu: true,
        items: [
            form({
                fieldDefaults: {
                    commitOnChange: true,
                    minimal: true,
                    requiredIndicator: null
                },
                items: [
                    formField({
                        field: 'rowCount',
                        // No `min` or `max` - with `displayWithCommas` they leave the input
                        // blank. The field's rules reject a count out of range instead.
                        item: numberInput({
                            displayWithCommas: true,
                            enableShorthandUnits: true,
                            width: 80
                        })
                    }),
                    formField({
                        field: 'colCount',
                        item: numberInput({min: 1, width: 80})
                    }),
                    formField({
                        field: 'isColVirtualizationEnabled',
                        item: checkbox()
                    }),
                    formField({
                        field: 'cellFormatting',
                        item: select({
                            width: 110,
                            enableFilter: false,
                            hideSelectedOptionCheck: true,
                            options: [
                                {value: 'plain', label: 'Plain'},
                                {value: 'formatter', label: 'Formatter'},
                                {value: 'renderer', label: 'Renderer'}
                            ]
                        })
                    })
                ]
            }),
            applyButton(),
            toolbarSeparator(),
            // One item, so the label and input move into the overflow menu together.
            hbox({
                alignItems: 'center',
                gap: true,
                items: [
                    span('Scroll Factor'),
                    numberInput({bind: 'scrollFactor', min: 1, width: 50})
                ]
            })
        ]
    })
);

// Reads the form state itself, so an edit re-renders only this button. A toolbar re-render would
// rebuild the overflow menu and close it mid-edit.
const applyButton = hoistCmp.factory<GridScrollingModel>(({model}) => {
    const {formModel} = model;
    return button({
        text: 'Apply',
        outlined: true,
        disabled: !formModel.isValid || !formModel.isDirty,
        onClick: () => model.applyConfigs()
    });
});

interface ScrollTargetProps extends HoistProps<GridScrollingModel> {
    grid: ScrollTarget;
}

// Sits under each grid, so its readout stays beside the grid it measured.
const scrollBar = hoistCmp.factory<ScrollTargetProps>(({model, grid}) =>
    toolbar(
        button({
            text: `Scroll ${upperFirst(grid)}Grid`,
            onClick: () => model.scrollGridAsync(grid),
            disabled: !model.scrollFactor
        }),
        span({
            className: 'xh-text-color-muted',
            item: formatResult(model.scrollResults[grid])
        })
    )
);

function formatResult(result: ScrollResult): string {
    if (!result) return null;
    const {totalMs, maxStepMs, steps} = result;
    return `${Math.round(totalMs)}ms / ${steps} steps, worst ${Math.round(maxStepMs)}ms`;
}
