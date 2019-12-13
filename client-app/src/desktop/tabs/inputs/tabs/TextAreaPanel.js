import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {TextArea} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {hoistCmp} from '@xh/hoist/core';
import {inputTestPanel} from '../InputTestPanel';
import {p} from '@xh/hoist/cmp/layout';

export const TextAreaPanel = hoistCmp({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        description:
            [
                p('A multi-line text input.')
            ],
        componentName: 'TextArea',
        props: {
            autoFocus: {
                value: true,
                type: T.Boolean,
                description: 'True to focus the control on render.'
            },
            commitOnChange: {
                value: false,
                type: T.Boolean,
                description: 'True to commit on every change/keystroke, default false.'
            },
            fill: {
                value: null,
                type: T.Boolean,
                description: 'True to take up the full width of container.'
            },
            onKeyDown: {
                value: null,
                type: T.Function,
                description: 'Callback for normalized keydown event.'
            },
            placeholder: {
                value: null,
                type: T.String,
                description: 'Text to display when control is empty.'
            },
            selectOnFocus: {
                value: false,
                type: T.Boolean,
                description: 'True to select contents when control receives focus.'
            },
            spellCheck: {
                value: false,
                type: T.Boolean,
                description: 'True to allow browser spell check, default false.'
            }
        },
        scope: {
            TextArea,
            Icon
        }
    });
}