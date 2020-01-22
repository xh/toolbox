import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {Slider} from '@xh/hoist/desktop/cmp/input';
import {hoistCmp} from '@xh/hoist/core';
import {inputTestPanel} from '../InputTestPanel';
import {p} from '@xh/hoist/cmp/layout';

export const sliderPanel = hoistCmp.factory({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        description:
            [
                p('A slider input configured to edit a single number.')
            ],
        componentName: 'Slider',
        props: {
            max: {
                value: 7,
                type: T.Number,
                description: 'Maximum value'
            },
            min: {
                value: 0,
                type: T.Number,
                description: 'Minimum value'
            },
            labelRenderer: {
                value: true,
                type: T.Function,
                description:
                    'Callback to render each label, passed the number value for that label point. \n' +
                    'If true, labels will use number value formatted to labelStepSize decimal places. \n' +
                    'If false, labels will not be shown.'
            },
            labelStepSize: {
                value: 1,
                type: T.Number,
                description: 'Increment between successive labels. Must be greater than zero. Defaults to 1.'
            },
            stepSize: {
                value: 1,
                type: T.Number,
                description: 'Increment between values. Must be greater than zero. Defaults to 1.'
            },
            showTrackFill: {
                value: true,
                type: T.Boolean,
                description:
                    'True to render a solid bar between min and current values (for simple slider) or between ' +
                    'handles (for range slider). Defaults to true.'
            },
            vertical: {
                value: false,
                type: T.Boolean,
                description: 'True to render in a vertical orientation.'
            }
        },
        scope: {
            Slider
        },
        value: 0
    });
}