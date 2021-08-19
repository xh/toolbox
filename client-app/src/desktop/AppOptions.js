import {themeAppOption, sizingModeAppOption, autoRefreshAppOption} from '@xh/hoist/desktop/cmp/appOption';
import {switchInput} from '@xh/hoist/desktop/cmp/input';

export function getAppOptions() {
    return [
        themeAppOption(),
        sizingModeAppOption(),
        autoRefreshAppOption(),
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
