import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as PT} from 'react-view';
import {Slider} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {hoistCmp} from '@xh/hoist/core';
import {inputTestPanel} from '../InputTestPanel';

export const SliderPanel = hoistCmp({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        componentName: 'Slider',
        props: {
            max: {
                value: 7,
                type: PT.Number,
                description: 'Maximum value'
            },
            min: {
                value: 0,
                type: PT.Number,
                description: 'Minimum value'
            },
            labelRenderer: {
                value: true,
                type: PT.Function,
                description:
                    'Callback to render each label, passed the number value for that label point. \n' +
                    'If true, labels will use number value formatted to labelStepSize decimal places. \n' +
                    'If false, labels will not be shown.'
            },
            labelStepSize: {
                value: 1,
                type: PT.Number,
                description: 'Increment between successive labels. Must be greater than zero. Defaults to 1.'
            },
            stepSize: {
                value: 1,
                type: PT.Number,
                description: 'Increment between values. Must be greater than zero. Defaults to 1.'
            },
            showTrackFill: {
                value: false,
                type: PT.Boolean,
                description:
                    'True to render a solid bar between min and current values (for simple slider) or between ' +
                    'handles (for range slider). Defaults to true.'
            },
            vertical: {
                value: false,
                type: PT.Boolean,
                description: 'True to render in a vertical orientation.'
            }
        },
        scope: {
            Slider,
            Icon
        },
        value: 0
    });
}