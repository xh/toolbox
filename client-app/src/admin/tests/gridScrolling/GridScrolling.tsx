import {grid} from '@xh/hoist/cmp/grid';
import {hframe, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistProps} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {GridScrollingModel} from './GridScrollingModel';
import {AgGridReact} from '@ag-grid-community/react';
import React from 'react';
import {toolbar, toolbarSeparator} from '@xh/hoist/desktop/cmp/toolbar';
import {numberInput} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';

export const gridScrolling = hoistCmp.factory({
    model: creates(GridScrollingModel),
    render({model}) {
        return panel({
            tbar: tbar(),
            item: hframe(
                grid({ref: model.hoistGridRef}),
                <div className="ag-theme-alpine" ref={model.agGridRef} style={{flex: 1}}>
                    <AgGridReact rowData={model.rowData} columnDefs={model.columnDefs} />
                </div>
            )
        });
    }
});

const tbar = hoistCmp.factory(() =>
    toolbar({
        items: [
            span('Rows'),
            numberInput({bind: 'rowCount', displayWithCommas: true, enableShorthandUnits: true}),
            toolbarSeparator(),
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
        text: `Scroll ${grid} grid`,
        onClick: () => model.scrollGrid(grid)
    })
);
