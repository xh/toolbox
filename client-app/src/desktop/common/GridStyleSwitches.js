import {hoistCmp, uses} from '@xh/hoist/core';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AgGridModel} from '@xh/hoist/cmp/ag-grid';

export const gridStyleSwitches = hoistCmp.factory({
    model: uses(AgGridModel),

    render() {
        return panel({
            title: 'Display Options',
            icon: Icon.settings(),
            className: 'tbox-display-opts',
            compactHeader: true,
            model: {side: 'right', defaultSize: 160, resizable: false},
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