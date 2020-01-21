import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {Checkbox} from '@xh/hoist/desktop/cmp/input';
import {hoistCmp} from '@xh/hoist/core';
import {inputTestPanel} from '../InputTestPanel';
import {p} from '@xh/hoist/cmp/layout';

export const checkboxPanel = hoistCmp.factory({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        description:
            [
                p('Checkbox control for boolean values.'),
                p('Renders null with an "indeterminate" [-] display.')
            ],
        componentName: 'Checkbox',
        props: {
            autoFocus: {
                value: false,
                type: T.Boolean,
                description: 'True to focus the control on render.'
            },
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
            displayUnsetState: {
                value: true,
                type: T.Boolean,
                description:
                    'True to render null or undefined as a distinct visual state.  If false (default),' +
                    'these values will appear unchecked and visually indistinct from false.'
            },
            labelAlign: {
                value: 'right',
                type: T.Enum,
                enumName: 'alignments',
                options: alignments,
                description: 'Alignment of the inline label relative to the control itself, default right.'
            }
        },
        scope: {
            Checkbox,
            alignments
        }
    });
}

const alignments = {
    left: 'left',
    right: 'right'
};