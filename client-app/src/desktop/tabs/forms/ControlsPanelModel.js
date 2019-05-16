import {HoistModel} from '@xh/hoist/core';
import {FormModel} from '@xh/hoist/cmp/form';
import {bindable} from '@xh/hoist/mobx';
import {fmtCalendarDate} from '@xh/hoist/format';
import moment from 'moment';
import {random} from 'lodash';

@HoistModel
export class ControlsPanelModel {

    @bindable commitOnChange = false;

    formModel = new FormModel({
        fields: [
            {name: 'text1'},
            {name: 'text2'},
            {name: 'text3'},
            {name: 'text4'},
            {name: 'text5'},
            {name: 'text6'},
            {name: 'number1'},
            {name: 'number2'},
            {name: 'number3', initialValue: random(0, 100)},
            {name: 'number4'},
            {name: 'range1', initialValue: [random(50000, 70000), random(110000, 150000)]},
            {name: 'option1', initialValue: 'CA'},
            {name: 'option2'},
            {name: 'option3'},
            {name: 'option4'},
            {name: 'option5'},
            {name: 'option6'},
            {name: 'date1'},
            {name: 'date2', initialValue: moment().startOf('hour').toDate()},
            {name: 'calendarDate', initialValue: fmtCalendarDate(moment().toDate())},
            {name: 'bool1'},
            {name: 'bool2'},
            {name: 'buttonGroup1', initialValue: 'button2'}
        ]
    });
}