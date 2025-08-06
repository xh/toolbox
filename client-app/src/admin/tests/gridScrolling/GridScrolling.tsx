import {grid} from '@xh/hoist/cmp/grid';
import {hframe, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistProps} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {GridScrollingModel} from './GridScrollingModel';
import {AgGridReact} from 'ag-grid-react';
import React from 'react';
import {toolbar, toolbarSeparator} from '@xh/hoist/desktop/cmp/toolbar';
import {checkbox, numberInput} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {upperFirst} from 'lodash';

export const gridScrolling = hoistCmp.factory({
    model: creates(GridScrollingModel),
    render({model}) {
        return panel({
            tbar: tbar(),
            item: hframe(
                grid({
                    ref: model.hoistGridRef
                }),
                <div className="ag-theme-alpine" ref={model.agGridRef} style={{flex: 1}}>
                    <AgGridReact
                        rowData={model.rowData}
                        columnDefs={model.columnDefs}
                        suppressColumnVirtualisation={!model.isColVirtualizationEnabled}
                        animateRows={false}
                    />
                </div>
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
            scrollButton({grid: 'ag'})
        ]
    })
);

interface ScrollButtonProps extends HoistProps<GridScrollingModel> {
    grid: 'ag' | 'hoist';
}

const scrollButton = hoistCmp.factory<ScrollButtonProps>(({model, grid}) =>
    button({
        text: `Scroll ${upperFirst(grid)}Grid`,
        onClick: () => model.scrollGrid(grid),
        disabled: !model.scrollFactor
    })
);
