import {fragment} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {GridModel} from '@xh/hoist/cmp/grid';


export const gridStyleSwitches = hoistCmp.factory({
    model: uses(GridModel),

    render({model, forToolbar}) {
        const sep = () =>  forToolbar ? toolbarSep() : null;
        return fragment(
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
            sep(),
            switchInput({
                bind: 'rowBorders',
                label: 'Row Borders',
                labelAlign: 'left'
            }),
            sep(),
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
            sep(),
            switchInput({
                bind: 'showCellFocus',
                label: 'Cell focus',
                labelAlign: 'left'
            })
        );
    }
});