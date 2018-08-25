import {HoistModel, field} from '@xh/hoist/core';
import {ValidationModel, required, isDate, isLength, isNumber} from '@xh/hoist/validation';
import {wait} from '@xh/hoist/promise';
import {random} from 'lodash';
import moment from 'moment';

@HoistModel()
export class FormsTabModel {

    // TextField / TextArea
    @field() text1 = null;
    @field() text2 = null;
    @field() text3 = null;
    @field() text4 = null;
    @field('Email') text5 = null;

    // NumberField / Single-val Slider
    @field() number1 = null;
    @field() number2 = null;
    @field() number3 = random(0, 100);
    @field() number4 = null;

    // Multi-val Slider
    @field('Price Range') range1 = [random(50000, 70000), random(110000, 150000)];

    // Dropdowns
    @field() option1 = null;
    @field() option2 = null;
    @field() option3 = null;
    @field() option4 = null;

    // Others
    @field() date1 = new Date();
    @field() bool1 = false;
    @field() bool2 = false;

    validationModel = new ValidationModel({
        rules: [
            {
                field: 'text1',
                checks: [required, isLength({max: 10})]
            },
            {
                field: 'number1',
                checks: [required, isLength({max: 10})]
            },
            {
                field: 'number2',
                checks: isNumber({min: 10})
            },
            {
                field: 'text5',
                checks: [
                    required,
                    ({value}) => {
                        return wait(100).then(() => {
                            if (!value.includes('@') || !value.includes('.')) {
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
                    isDate({min: moment().subtract(1, 'week').startOf('day').toDate()})
                ]
            },
            {
                field: 'endDate',
                checks: [
                    required,
                    isDate({min: moment().add(1, 'week').startOf('day').toDate()})
                ]
            },
            {
                field: 'endDate',
                when: (v, {startDate, endDate}) => startDate && endDate,
                checks: (v, {startDate, endDate}) => endDate < startDate ? 'End Date must be after startDate' : null
            }
        ],
        model: this
    });
}