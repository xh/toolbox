import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {AgGridModel} from '@xh/hoist/cmp/ag-grid';
import {fragment, label, vspacer} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';

export const agGridOptions = hoistCmp.factory({
    model: uses(AgGridModel),

    render({model}) {
        return fragment({
            items: [
                label('Sizing Mode'),
                select({
                    width: null,
                    bind: 'sizingMode',
                    options: [
                        {label: 'Large', value: 'large'},
                        {label: 'Standard', value: 'standard'},
                        {label: 'Compact', value: 'compact'},
                        {label: 'Tiny', value: 'tiny'}
                    ]
                }),
                vspacer(10),
                switchInput({
                    label: 'Dark Mode',
                    labelAlign: 'left',
                    bind: 'darkTheme',
                    model: XH
                }),
                switchInput({
                    bind: 'hideHeaders',
                    label: 'Hide Headers',
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
                }),
                vspacer(10),
                button({
                    text: 'Save grid state',
                    icon: Icon.save(),
                    minimal: false,
                    onClick: () => {
                        const state = model.getState();
                        console.log(state);
                        XH.localStorageService.set('agGridWrapperState', state);
                    }
                }),
                button({
                    text: 'Load grid state',
                    icon: Icon.grid(),
                    minimal: false,
                    onClick: () => {
                        const state = XH.localStorageService.get('agGridWrapperState');
                        model.setState(state);
                    }
                })
            ]
        });
    }
});
