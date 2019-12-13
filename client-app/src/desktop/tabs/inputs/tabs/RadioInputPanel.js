import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {RadioInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {hoistCmp} from '@xh/hoist/core';
import template from '@babel/template';

import {inputTestPanel} from '../InputTestPanel';

export const RadioInputPanel = hoistCmp({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        componentName: 'RadioInput',
        customProps: {
            options: {
                generate: () => {
                    return (template.ast(options, {plugins: ['jsx']}))
                        .expression;
                },
                parse: (code) => {}
            }
        },
        props: {
            options: {
                value: options,
                type: T.Custom
            },
            inline: {
                value: true,
                type: T.Boolean,
                description: 'True to display each radio button inline with each other.'
            },
            labelAlign: {
                value: null,
                type: T.Enum,
                enumName: JSON.stringify(alignments),
                options: alignments,
                description: 'Alignment of each option\'s label relative its radio button, default right.'
            }
        },
        scope: {
            RadioInput,
            Icon
        }
    });
}

const options =
    "['Steak', 'Chicken', {label: 'Fish', value: 'Fish', disabled: true}]";

const alignments = {
    left: 'left',
    right: 'right'
};