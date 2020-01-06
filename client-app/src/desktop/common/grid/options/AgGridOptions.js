import {hoistCmp, uses} from '@xh/hoist/core';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {AgGridModel} from '@xh/hoist/cmp/ag-grid';
import {fragment} from '@xh/hoist/cmp/layout';

export const agGridOptions = hoistCmp.factory({
    model: uses(AgGridModel),

    render() {
        return fragment({
            items: [
                switchInput({
                    bind: 'compact',
                    label: 'Compact',
                    labelAlign: 'left'
                }),
                switchInput({
                    bind: 'stripeRows',
                    label: 'Striped',
                    labelAlign: 'left'
                }),
                switchInput({
                    bind: 'rowBorders',
                    label: 'Row Borders',
                    labelAlign: 'left'
                }),
                switchInput({
                    bind: 'cellBorders',
                    label: 'Cell Borders',
                    labelAlign: 'left'
                }),
                switchInput({
                    bind: 'showHover',
                    label: 'Hover',
                    labelAlign: 'left'
                }),
                switchInput({
                    bind: 'showCellFocus',
                    label: 'Cell focus',
                    labelAlign: 'left'
                })
            ]
        });
    }
});