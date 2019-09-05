import React from 'react';
import {hoistElemFactory} from '@xh/hoist/core';
import {formGroup} from '@xh/hoist/kit/blueprint';
import {code, span} from '@xh/hoist/cmp/layout';


export const param = hoistElemFactory(
    ({label, bind, item, info, disabled}) => formGroup({
        label,
        item: React.cloneElement(item, {bind, disabled}),
        helperText: info ? span(code(bind), ' - ', info) : null
    })
);

export function nilAwareFormat(val, formatter) {
    if (val === undefined) return code('undefined');
    if (val === null) return code('null');
    return formatter(val);
}
