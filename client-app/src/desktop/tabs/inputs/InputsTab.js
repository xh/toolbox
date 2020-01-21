import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {dateInputPanel} from './tabs/DateInputPanel';
import {numberInputPanel} from './tabs/NumberInputPanel';
import {sliderPanel} from './tabs/SliderPanel';
import {textInputPanel} from './tabs/TextInputPanel';
import {buttonGroupInputPanel} from './tabs/ButtonGroupInputPanel';
import {checkboxPanel} from './tabs/CheckboxPanel';
import {jsonInputPanel} from './tabs/JsonInputPanel';
import {radioInputPanel} from './tabs/RadioInputPanel';
import {selectPanel} from './tabs/SelectPanel';
import {sliderRangePanel} from './tabs/SliderRangePanel';
import {switchInputPanel} from './tabs/SwitchInputPanel';
import {textAreaPanel} from './tabs/TextAreaPanel';
import {selectQueryPanel} from './tabs/SelectQueryPanel';

export const inputsTab = hoistCmp.factory(
    () => tabContainer({
        model: {
            route: 'default.inputs',
            switcherPosition: 'left',
            tabs: [
                {id: 'buttonGroupInput', title: 'ButtonGroupInput', content: buttonGroupInputPanel},
                {id: 'checkbox', title: 'Checkbox', content: checkboxPanel},
                {id: 'dateInput', title: 'DateInput', content: dateInputPanel},
                {id: 'jsonInput', title: 'JsonInput', content: jsonInputPanel},
                {id: 'numberInput', title: 'NumberInput', content: numberInputPanel},
                {id: 'radioInput', title: 'RadioInput', content: radioInputPanel},
                {id: 'select', title: 'Select', content: selectPanel},
                {id: 'selectQuery', title: 'Select (query)', content: selectQueryPanel},
                {id: 'slider', title: 'Slider', content: sliderPanel},
                {id: 'sliderRange', title: 'Slider (range)', content: sliderRangePanel},
                {id: 'switchInput', title: 'SwitchInput', content: switchInputPanel},
                {id: 'textArea', title: 'TextArea', content: textAreaPanel},
                {id: 'textInput', title: 'TextInput', content: textInputPanel}
            ]
        },
        className: 'toolbox-tab'
    })
);