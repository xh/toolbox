import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {random} from 'lodash';

@HoistModel()
export class FormsTabModel {
    // TextField / TextArea
    @bindable text1 = null;
    @bindable text2 = null;
    @bindable text3 = null;
    @bindable text4 = null;
    @bindable text5 = null;

    // NumberField / Single-val Slider
    @bindable number1 = null;
    @bindable number2 = null;
    @bindable number3 = random(0, 100);
    @bindable number4 = null;

    // Multi-val Slider
    @bindable range1 = [random(50000, 70000), random(110000, 150000)];

    // Dropdowns
    @bindable option1 = null;
    @bindable option2 = null;
    @bindable option3 = null;
    @bindable option4 = null;

    // Multiselect
    @bindable option5 = null;

    // Others
    @bindable date1 = new Date();
    @bindable bool1 = false;
    @bindable bool2 = false;
}