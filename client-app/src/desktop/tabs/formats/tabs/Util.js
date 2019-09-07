import {cloneElement} from 'react';
import {hoistCmpFactory} from '@xh/hoist/core';
import {formGroup} from '@xh/hoist/kit/blueprint';
import {code, span} from '@xh/hoist/cmp/layout';


export const param = hoistCmpFactory(
    ({label, bind, input, info, disabled}) => formGroup({
        label,
        item: cloneElement(input, {bind, disabled}),
        helperText: info ? span(code(bind), ' - ', info) : null
    })
);

export function nilAwareFormat(val, formatter) {
    if (val === undefined) return code('undefined');
    if (val === null) return code('null');
    return formatter(val);
}
