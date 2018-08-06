import {HoistModel} from '@xh/hoist/core';
import {observable, action} from '@xh/hoist/mobx';
import {random} from 'lodash';

@HoistModel()
export class FormsTabModel {
    // TextField / TextArea
    @observable text1 = null;
    @observable text2 = null;
    @observable text3 = null;
    @observable text4 = null;
    @observable text5 = null;

    // NumberField / Single-val Slider
    @observable number1 = null;
    @observable number2 = null;
    @observable number3 = random(0, 100);
    @observable number4 = null;

    // Multi-val Slider
    @observable range1 = [random(50000, 70000), random(110000, 150000)];

    // Dropdowns
    @observable option1 = null;
    @observable option2 = null;
    @observable option3 = null;
    @observable option4 = null;

    // Others
    @observable date1 = new Date();
    @observable bool1 = false;
    @observable bool2 = false;


    @action setText1(v) {this.text1 = v}
    @action setText2(v) {this.text2 = v}
    @action setText3(v) {this.text3 = v}
    @action setText4(v) {this.text4 = v}
    @action setText5(v) {this.text5 = v}
    @action setNumber1(v) {this.number1 = v}
    @action setNumber2(v) {this.number2 = v}
    @action setNumber3(v) {this.number3 = v}
    @action setNumber4(v) {this.number4 = v}
    @action setOption1(v) {this.option1 = v}
    @action setOption2(v) {this.option2 = v}
    @action setOption3(v) {this.option3 = v}
    @action setOption4(v) {this.option4 = v}
    @action setRange1(v) {this.range1 = v}
    @action setDate1(v) {this.date1 = v}
    @action setBool1(v) {this.bool1 = v}
    @action setBool2(v) {this.bool2 = v}

}