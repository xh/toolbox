import {filler} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {dialog} from '@xh/hoist/kit/blueprint';
import {copyTextAsync} from './copyLink';

/** JSON to show in a {@link jsonDialog}, with its title. */
export interface ShownJson {
    title: string;
    json: string;
}

interface JsonDialogProps extends HoistProps {
    /** The JSON to show, or null to show nothing. */
    shown: ShownJson;
    onClose: () => void;
}

/** A read-only view of some JSON, with Copy. */
export const jsonDialog = hoistCmp.factory<JsonDialogProps>({
    model: false,
    render: ({shown, onClose}) =>
        dialog({
            isOpen: !!shown,
            onClose,
            title: shown?.title,
            icon: Icon.code(),
            style: {width: 640, height: 560},
            children: shown
                ? panel({
                      children: jsonInput({
                          value: shown.json,
                          readonly: true,
                          enableSearch: true,
                          flex: 1,
                          width: '100%'
                      }),
                      bbar: [
                          filler(),
                          button({
                              text: 'Copy',
                              icon: Icon.copy(),
                              onClick: () => copyTextAsync(shown.json, 'JSON')
                          }),
                          button({text: 'Close', onClick: onClose})
                      ]
                  })
                : null
        })
});
