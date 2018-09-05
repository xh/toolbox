import {HoistModel} from '@xh/hoist/core';
import {FieldSupport, field} from '@xh/hoist/field';
import {random} from 'lodash';

@HoistModel
@FieldSupport
export class ControlsPanelModel {

    // TextField / TextArea
    @field() text1
    @field() text2
    @field() text3
    @field() text4
    @field() text5

    // NumberField / Single-val Slider
    @field() number1
    @field() number2
    @field() number3
    @field() number4

    // Multi-val Slider
    @field() range1

    // Dropdowns
    @field() option1
    @field() option2
    @field() option3
    @field() option4
    @field() option5

    // Others
    @field() startDate;
    @field() endDate;
    @field() bool1;
    @field() bool2;


    constructor() {
        this.initFields({
            number3: random(0, 100),
            range1: [random(50000, 70000), random(110000, 150000)],
            startDate: new Date(),
            endDate: new Date()
        });
    }
}