import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {DateInputPanel} from './tabs/DateInputPanel';
import {NumberInputPanel} from './tabs/NumberInputPanel';
import {SliderPanel} from './tabs/SliderPanel';
import {TextInputPanel} from './tabs/TextInputPanel';
import {ButtonGroupInputPanel} from './tabs/ButtonGroupInputPanel';
import {CheckboxPanel} from './tabs/CheckboxPanel';
import {JsonInputPanel} from './tabs/JsonInputPanel';
import {RadioInputPanel} from './tabs/RadioInputPanel';
import {SelectPanel} from './tabs/SelectPanel';
import {SliderRangePanel} from './tabs/SliderRangePanel';
import {SwitchInputPanel} from './tabs/SwitchInputPanel';
import {TextAreaPanel} from './tabs/TextAreaPanel';
import {SelectQueryPanel} from './tabs/SelectQueryPanel';

export const InputsTab = hoistCmp(
    () => tabContainer({
        model: {
            route: 'default.inputs',
            switcherPosition: 'left',
            tabs: [
                {id: 'buttonGroupInput', title: 'ButtonGroupInput', content: ButtonGroupInputPanel},
                {id: 'checkbox', title: 'Checkbox', content: CheckboxPanel},
                {id: 'dateInput', title: 'DateInput', content: DateInputPanel},
                {id: 'jsonInput', title: 'JsonInput', content: JsonInputPanel},
                {id: 'numberInput', title: 'NumberInput', content: NumberInputPanel},
                {id: 'radioInput', title: 'RadioInput', content: RadioInputPanel},
                {id: 'select', title: 'Select', content: SelectPanel},
                {id: 'selectQuery', title: 'Select (query)', content: SelectQueryPanel},
                {id: 'slider', title: 'Slider', content: SliderPanel},
                {id: 'sliderRange', title: 'Slider (range)', content: SliderRangePanel},
                {id: 'switchInput', title: 'SwitchInput', content: SwitchInputPanel},
                {id: 'textArea', title: 'TextArea', content: TextAreaPanel},
                {id: 'textInput', title: 'TextInput', content: TextInputPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);