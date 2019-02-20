import {XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, select} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon/Icon';

export function getAppOptions() {
    return [
        {
            name: 'theme',
            formField: {
                item: buttonGroupInput(
                    button({value: false, text: 'Light', icon: Icon.sun()}),
                    button({value: true, text: 'Dark', icon: Icon.moon()})
                )
            },
            valueGetter: () => XH.darkTheme,
            valueSetter: (v) => XH.acm.themeModel.setDarkTheme(v)
        },
        {
            name: 'defaultGridMode',
            prefName: 'defaultGridMode',
            formField: {
                label: 'Default grid size',
                item: buttonGroupInput(
                    button({value: 'STANDARD', text: 'Standard', icon: Icon.gridLarge()}),
                    button({value: 'COMPACT', text: 'Compact', icon: Icon.grid()})
                )
            },
            refreshRequired: true
        },
        {
            name: 'autoRefresh',
            formField: {
                label: 'Auto-Refresh',
                item: select({
                    options: [
                        {value: -1, label: 'Disabled'},
                        {value: 15, label: 'Every 15 Seconds'},
                        {value: 60, label: 'Every 60 Seconds'}
                    ]
                })
            },
            valueGetter: () => XH.autoRefreshService.interval,
            valueSetter: (v) => XH.autoRefreshService.setInterval(v)
        }
    ];
}