import {HoistModel} from '@xh/hoist/core';
import {FormSupport, field, required, dateIs, lengthIs, numberIs} from '@xh/hoist/cmp/form';
import {wait} from '@xh/hoist/promise';
import {random, isNil} from 'lodash';
import moment from 'moment';

@HoistModel()
@FormSupport
export class FormsTabModel {

    // TextField / TextArea
    @field(lengthIs({max: 20}))
    text1 = null;

    @field('Email',
        required,
        ({value}) => {
            if (isNil(value)) return;
            return wait(100).then(() => {
                if ((!value.includes('@') || !value.includes('.'))) {
                    return 'Backend says this is not a valid email';
                }
            });
        }
    )
    text2 = null;

    @field('Sniff')
    text3 = null;

    @field('Text 4', required, lengthIs({max: 20}))
    text4 = null;

    @field()
    text5 = null;

    // NumberField / Single-val Slider
    @field(required, numberIs({max: 10}))
    number1 = null;

    @field()
    number2 = null;

    @field()
    number3 = random(0, 100);

    @field()
    number4 = null;

    // Multi-val Slider
    @field('Price Range')
    range1 = [random(50000, 70000), random(110000, 150000)];

    // Dropdowns
    @field()
    option1 = null;

    @field()
    option2 = null;

    @field()
    option3 = null;

    @field()
    option4 = null;

    // Others
    @field(required, dateIs({min: moment().subtract(1, 'week').startOf('day').toDate()}))
    startDate = new Date();

    @field()
    endDate = new Date();

    @field()
    bool1 = false;

    @field()
    bool2 = false;

    constructor() {
        window.sniff = this;
        this.validationModel.addRules('endDate', {
            when: (v, {startDate, endDate}) => startDate && endDate,
            check: (v, {startDate, endDate}) => endDate < startDate ? 'End Date must be after startDate' : null
        });
    }
}