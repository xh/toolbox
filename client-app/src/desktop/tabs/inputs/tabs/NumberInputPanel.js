import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {NumberInput} from '@xh/hoist/desktop/cmp/input';
import {hoistCmp} from '@xh/hoist/core';
import {inputTestPanel} from '../InputTestPanel';
import {li, p, ul} from '@xh/hoist/cmp/layout';

export const numberInputPanel = hoistCmp.factory({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        description:
            [
                p('Number input, with optional support for formatted of display value, shorthand units, and more.'),
                p('This component is built on the Blueprint NumericInput and gets default increment/decrement ' +
                    'functionality from that component, based on the three stepSize props. '),
                p('This Hoist component hides the up/down buttons by default but keeps the keyboard handling.'),
                p('Users can use the following keys to increment/decrement:'),
                ul(
                    li('↑/↓           by one step'),
                    li('Shift + ↑/↓   by one major step'),
                    li('Alt + ↑/↓     by one minor step')
                ),
                p('Set the corresponding stepSize prop(s) to null to disable this feature.')
            ],
        componentName: 'NumberInput',
        props: {
            autoFocus: {
                value: false,
                type: T.Boolean,
                description: 'True to focus the control on render.',
                hidden: true
            },
            commitOnChange: {
                value: false,
                type: T.Boolean,
                description: 'True to commit on every change/keystroke, default false.'
            },
            displayWithCommas: {
                value: false,
                type: T.Boolean,
                description: 'True to insert commas in displayed value.'
            },
            enableShorthandUnits: {
                value: false,
                type: T.Boolean,
                description: 'True to convert entries suffixed with k/m/b to thousands/millions/billions.'
            },
            fill: {
                value: true,
                type: T.Boolean,
                description: 'True to take up the full width of container.',
                hidden: true
            },
            leftIcon: {
                value: null,
                type: T.ReactNode,
                description: 'Icon to display inline on the left side of the input.'
            },
            min: {
                value: null,
                type: T.Number,
                description: 'Minimum value for decrement'
            },
            majorStepSize: {
                value: null,
                type: T.Number,
                description: 'Major step size for increment/decrement handling.'
            },
            max: {
                value: null,
                type: T.Number,
                description: 'Maximum value for increment'
            },
            minorStepSize: {
                value: null,
                type: T.Number,
                description: 'Minor step size for increment/decrement handling.'
            },
            onKeyDown: {
                value: null,
                type: T.Function,
                description: 'Callback for normalized keydown event.',
                hidden: true
            },
            placeholder: {
                value: null,
                type: T.String,
                description: 'Text to display when control is empty.'
            },
            precision: {
                value: 4,
                type: T.Number,
                description: 'Max decimal precision of the value, defaults to 4.'
            },
            rightElement: {
                value: null,
                type: T.ReactNode,
                description: 'Element to display inline on the right side of the input.',
                hidden: true
            },
            selectOnFocus: {
                value: false,
                type: T.Boolean,
                description: 'True to select contents when control receives focus.'
            },
            stepSize: {
                value: 1,
                type: T.Number,
                description: 'Standard step size for increment/decrement handling.'
            },
            textAlign: {
                value: 'right',
                type: T.Enum,
                enumName: 'alignments',
                options: alignments,
                description: 'Alignment of entry text within control, default \'right\'.'
            },
            zeroPad: {
                value: false,
                type: T.Boolean,
                description: 'True to pad with trailing zeros out to precision, default false.'
            }
        },
        scope: {
            NumberInput,
            alignments
        }
    });
}

const alignments = {
    left: 'left',
    right: 'right'
};