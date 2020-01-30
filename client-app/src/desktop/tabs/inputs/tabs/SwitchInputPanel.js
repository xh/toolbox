import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {SwitchInput} from '@xh/hoist/desktop/cmp/input';
import {hoistCmp} from '@xh/hoist/core';

import {inputTestPanel} from '../InputTestPanel';
import {p} from '@xh/hoist/cmp/layout';

export const switchInputPanel = hoistCmp.factory({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        description:
            [
                p('Switch (toggle) control for non-nullable boolean values.')
            ],
        componentName: 'SwitchInput',
        props: {
            inline: {
                value: false,
                type: T.Boolean,
                description: 'True (default) if the control should appear as an inline element.',
                hidden: true
            },
            label: {
                value: null,
                type: T.String,
                description:
                    'Label text displayed adjacent to the control itself.\n' +
                    'Can be used with or without an additional overall label as provided by FormField.'
            },
            labelAlign: {
                value: 'left',
                type: T.Enum,
                enumName: 'alignments',
                options: alignments,
                description: 'Alignment of the inline label relative to the control itself, default right.'
            }
        },
        scope: {
            SwitchInput,
            alignments
        }
    });
}

const alignments = {
    left: 'left',
    right: 'right'
};