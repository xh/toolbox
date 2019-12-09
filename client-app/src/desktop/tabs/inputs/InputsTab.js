import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {DateInputPanel} from './tabs/DateInputPanel';
import {NumberInputPanel} from './tabs/NumberInputPanel';
import {SliderPanel} from './tabs/SliderPanel';

export const InputsTab = hoistCmp(
    () => tabContainer({
        model: {
            route: 'default.inputs',
            switcherPosition: 'left',
            tabs: [
                {id: 'dateInput', title: 'DateInput', content: DateInputPanel},
                {id: 'numberInput', title: 'NumberInput', content: NumberInputPanel},
                {id: 'slider', title: 'Slider', content: SliderPanel}

            ]
        },
        className: 'toolbox-tab'
    })
);
