import React from 'react';
import {formGroup} from '@xh/hoist/kit/blueprint';
import {code, span} from '@xh/hoist/cmp/layout';

export function param({label, field, item, model, info, disabled}) {
    return formGroup({
        label,
        item: React.cloneElement(item, {model, field, disabled}),
        helperText: info ? span(code(field), ' - ', info) : null
    });
}

export function nilAwareFormat(val, formatter) {
    if (val === undefined) return code('undefined');
    if (val === null) return code('null');
    return formatter(val);
}
