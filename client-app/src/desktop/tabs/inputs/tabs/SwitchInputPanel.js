import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {SwitchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {hoistCmp} from '@xh/hoist/core';

import {inputTestPanel} from '../InputTestPanel';

export const SwitchInputPanel = hoistCmp({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        componentName: 'SwitchInput',
        props: {
            inline: {
                value: true,
                type: T.Boolean,
                description: 'True (default) if the control should appear as an inline element.'
            },
            label: {
                value: null,
                type: T.String,
                description:
                    'Label text displayed adjacent to the control itself.\n' +
                    'Can be used with or without an additional overall label as provided by FormField.'
            },
            labelAlign: {
                value: null,
                type: T.Enum,
                enumName: JSON.stringify(alignments),
                options: alignments,
                description: 'Alignment of the inline label relative to the control itself, default right.'
            }
        },
        scope: {
            SwitchInput,
            Icon
        }
    });
}

const alignments = {
    left: 'left',
    right: 'right'
};