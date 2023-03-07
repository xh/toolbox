import {cloneElement} from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {formGroup} from '@xh/hoist/kit/blueprint';
import {code, span} from '@xh/hoist/cmp/layout';

export const param = hoistCmp.factory({
    render({label, bind, input, info, disabled}) {
        return formGroup({
            label,
            item: cloneElement(input, {bind, disabled}),
            helperText: info ? span(code(bind), ' - ', info) : null
        });
    }
});

export function nilAwareFormat(val, formatter) {
    if (val === undefined) return code('undefined');
    if (val === null) return code('null');
    return formatter(val);
}
