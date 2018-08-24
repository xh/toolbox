import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {ValidationModel, required, date, length, number} from '@xh/hoist/validation';
import {random} from 'lodash';
import moment from 'moment';

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

    // Others
    @bindable date1 = new Date();
    @bindable bool1 = false;
    @bindable bool2 = false;

    displayNames = {
        text1: 'Text 1',
        number2: 'Number 2',
        email: 'Email',
        startDate: 'Start Date',

    };

    validationModel = new ValidationModel({
        rules: [
            {
                field: 'text1',
                checks: [required, length({max: 10})]
            },
            {
                field: 'number1',
                checks: [required, length({max: 10})]
            {
                field: 'number2',
                checks: length({min: 10})
            },
            {
                field: 'email',
                checks: [
                    required,
                    ({value}) => {
                        return wait(100).then(() => {
                            if !(value.includes('@') && value.includes('.')) {
                                return 'Backend says this is not a valid email';
                            }
                        });
                    }
                ]
            },
            {
                field: 'startDate',
                checks: [
                    required,
                    date({min: moment().subtract(1, 'week').startOf('day').toDate()})
                ]
            },
            {
                field: 'endDate',
                checks: [
                    required,
                    date({min: moment().add(1, 'week').startOf('day').toDate()})
                ]
            },
            {
                field: 'endDate'
                when: (v, {startDate, endDate}) => startDate && endDate
                checks: (v, {startDate, endDate}) => endDate < (startDate) ? 'End Date must be after startDate' : null
            }
        ],
        model: this
    }
}