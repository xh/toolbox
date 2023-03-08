import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {AgGridModel} from '@xh/hoist/cmp/ag-grid';
import {fragment, label, vspacer} from '@xh/hoist/cmp/layout';

export const agGridOptions = hoistCmp.factory({
    model: uses(AgGridModel),

    render() {
        return fragment({
            items: [
                label('Sizing Mode'),
                select({
                    width: null,
                    bind: 'sizingMode',
                    options: [
                        {label: 'Tiny', value: 'tiny'},
                        {label: 'Compact', value: 'compact'},
                        {label: 'Standard', value: 'standard'},
                        {label: 'Large', value: 'large'}
                    ]
                }),
                vspacer(10),
                switchInput({
                    label: 'Dark Mode',
                    labelSide: 'left',
                    bind: 'darkTheme',
                    model: XH.appContainerModel.themeModel
                }),
                switchInput({
                    bind: 'hideHeaders',
                    label: 'Hide Headers',
                    labelSide: 'left'
                }),
                switchInput({
                    bind: 'stripeRows',
                    label: 'Striped',
                    labelSide: 'left'
                }),
                switchInput({
                    bind: 'rowBorders',
                    label: 'Row Borders',
                    labelSide: 'left'
                }),
                switchInput({
                    bind: 'cellBorders',
                    label: 'Cell Borders',
                    labelSide: 'left'
                }),
                switchInput({
                    bind: 'showHover',
                    label: 'Hover',
                    labelSide: 'left'
                }),
                switchInput({
                    bind: 'showCellFocus',
                    label: 'Cell focus',
                    labelSide: 'left'
                })
            ]
        });
    }
});
