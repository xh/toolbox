import {XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon/Icon';
import {startCase} from 'lodash';

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
            valueSetter: (v) => XH.setDarkTheme(v)
        },
        {
            name: 'defaultGridMode',
            prefName: 'defaultGridMode',
            formField: {
                label: 'Default grid size',
                item: buttonGroupInput(
                    getGridSizeModeButton('large'),
                    getGridSizeModeButton('standard'),
                    getGridSizeModeButton('compact'),
                    getGridSizeModeButton('tiny')
                )
            },
            reloadRequired: true
        },
        {
            name: 'autoRefresh',
            prefName: 'xhAutoRefreshEnabled',
            formField: {
                label: 'Auto-refresh',
                info: `Enable to auto-refresh app data every ${XH.autoRefreshService.interval} seconds`,
                item: switchInput()
            }
        },
        {
            name: 'expandDockedLinks',
            prefName: 'expandDockedLinks',
            formField: {
                label: 'Expand Links',
                info: 'Enable to always expand the docked Links panel when available.',
                item: switchInput()
            }
        }
    ];
}

function getGridSizeModeButton(size) {
    return button({
        value: size,
        text: startCase(size),
        style: {
            fontSize: `var(--xh-grid-${size}-font-size-px`
        }
    });
}
