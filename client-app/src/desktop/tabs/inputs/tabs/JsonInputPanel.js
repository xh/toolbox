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
                description: 'Configuration object with any properties supported by the CodeMirror API.',
                hidden: true
            },
            showFormatButton: {
                value: true,
                type: T.Boolean,
                description:
                    'True (default) to display autoformat button at top-right of input.\n ' +
                    'Requires a `formatter` to be configured - button will never show otherwise.'
            },
            showFullscreenButton: {
                value: true,
                type: T.Boolean,
                description: 'True (default) to display Fullscreen button at top-right of input.'
            }
        },
        scope: {
            JsonInput
        }
    });
}