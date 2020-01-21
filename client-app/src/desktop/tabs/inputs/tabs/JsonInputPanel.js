import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {JsonInput} from '@xh/hoist/desktop/cmp/input';
import {hoistCmp} from '@xh/hoist/core';
import {inputTestPanel} from '../InputTestPanel';
import {p} from '@xh/hoist/cmp/layout';

export const jsonInputPanel = hoistCmp.factory({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        description:
            [
                p('Code-editor style input for editing and validating JSON, powered by CodeMirror.')
            ],
        componentName: 'JsonInput',
        props: {
            commitOnChange: {
                value: false,
                type: T.Boolean,
                description: 'True to commit on every change/keystroke, default false.'
            },
            editorProps: {
                value: null,
                type: T.Object,
                description: 'Configuration object with any properties supported by the CodeMirror API.'
            },
            showActionButtons: {
                value: true,
                type: T.Boolean,
                description: 'True to show Fullscreen + Auto-format buttons at top-right of input.'
            }
        },
        scope: {
            JsonInput
        }
    });
}