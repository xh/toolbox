import React from 'react';
import {formGroup} from '@xh/hoist/kit/blueprint';
import {code, span} from '@xh/hoist/cmp/layout';

export function param({label, bind, item, model, info, disabled}) {
    return formGroup({
        label,
        item: React.cloneElement(item, {model, bind, disabled}),
        helperText: info ? span(code(bind), ' - ', info) : null
    });
}

export function nilAwareFormat(val, formatter) {
    if (val === undefined) return code('undefined');
    if (val === null) return code('null');
    return formatter(val);
}
