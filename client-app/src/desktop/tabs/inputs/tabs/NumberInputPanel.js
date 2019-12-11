import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {NumberInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {hoistCmp} from '@xh/hoist/core';
import {inputTestPanel} from '../InputTestPanel';

export const NumberInputPanel = hoistCmp({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        componentName: 'NumberInput',
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
                value: true, type:
                T.Boolean,
                description: 'True to take up the full width of container.'
            },
            leftIcon: {
                value: null,
                type: T.ReactElement,
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
                description: 'Callback for normalized keydown event.'
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
                type: T.ReactElement,
                description: 'Element to display inline on the right side of the input.'
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
                value: null,
                type: T.Enum,
                enumName: JSON.stringify(alignments),
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
            Icon
        }
    });
}

const alignments = {
    ['left']: 'left',
    ['right']: 'right'
};