import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {Slider} from '@xh/hoist/desktop/cmp/input';
import {hoistCmp} from '@xh/hoist/core';
import {inputTestPanel} from '../InputTestPanel';
import {p} from '@xh/hoist/cmp/layout';
import {sliderProps} from './SliderPanel';

export const sliderRangePanel = hoistCmp.factory({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        description:
            [
                p('A slider input configured to edit an array of two numbers (for a range).')
            ],
        componentName: 'Slider',
        props: sliderProps,
        scope: {
            Slider
        },
        value: [0, 1]
    });
}