import {HoistModel} from '@xh/hoist/core';
import {FieldSupport, field} from '@xh/hoist/field';
import {random} from 'lodash';

@HoistModel()
@FieldSupport
export class ControlsPanelModel {

    // TextField / TextArea
    @field() text1 = null;
    @field() text2 = null;
    @field() text3 = null;
    @field() text4 = null;
    @field() text5 = null;

    // NumberField / Single-val Slider
    @field() number1 = null;
    @field() number2 = null;
    @field() number3 = random(0, 100);
    @field() number4 = null;

    // Multi-val Slider
    @field() range1 = [random(50000, 70000), random(110000, 150000)];

    // Dropdowns
    @field() option1 = null;
    @field() option2 = null;
    @field() option3 = null;
    @field() option4 = null;

    // Others
    @field() startDate = new Date();
    @field() endDate = new Date();
    @field() bool1 = false;
    @field() bool2 = false;
}