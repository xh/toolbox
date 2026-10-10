import {form} from '@xh/hoist/cmp/form';
import {grid} from '@xh/hoist/cmp/grid';
import {div, hframe, span} from '@xh/hoist/cmp/layout';
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
import {GRID_SIZING, GridScrollingModel, type ScrollTarget} from './GridScrollingModel';

export const gridScrolling = hoistCmp.factory({
    model: creates(GridScrollingModel),

    render({model}) {
        return panel({
            tbar: tbar(),
            // Keyed so both grids remount when Apply rebuilds them - see `gridGeneration`.
            item: hframe(
                grid({
                    key: model.gridGeneration,
                    ref: model.hoistGridRef
                }),
                div({
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
                })
            )
        });
    }
});

const tbar = hoistCmp.factory<GridScrollingModel>(({model}) =>
    toolbar({
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
                        item: numberInput({
                            displayWithCommas: true,
                            enableShorthandUnits: true,
                            width: 80
                        })
                    }),
                    formField({
                        field: 'colCount',
                        item: numberInput({width: 80})
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
            button({
                text: 'Apply',
                outlined: true,
                disabled: !model.formModel.isValid || !model.formModel.isDirty,
                onClick: () => model.applyConfigs()
            }),
            toolbarSeparator(),
            span('Scroll Factor'),
            numberInput({bind: 'scrollFactor', width: 50}),
            scrollButton({grid: 'hoist'}),
            scrollResult({grid: 'hoist'}),
            scrollButton({grid: 'ag'}),
            scrollResult({grid: 'ag'})
        ]
    })
);

interface ScrollTargetProps extends HoistProps<GridScrollingModel> {
    grid: ScrollTarget;
}

const scrollButton = hoistCmp.factory<ScrollTargetProps>(({model, grid}) =>
    button({
        text: `Scroll ${upperFirst(grid)}Grid`,
        onClick: () => model.scrollGridAsync(grid),
        disabled: !model.scrollFactor
    })
);

const scrollResult = hoistCmp.factory<ScrollTargetProps>(({model, grid}) => {
    const result = model.scrollResults[grid];
    if (!result) return null;

    const {totalMs, maxStepMs, steps} = result;
    return span({
        className: 'xh-text-color-muted',
        item: `${Math.round(totalMs)}ms / ${steps} steps, worst ${Math.round(maxStepMs)}ms`
    });
});
