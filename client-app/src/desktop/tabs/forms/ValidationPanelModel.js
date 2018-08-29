import {HoistModel} from '@xh/hoist/core';
import {FieldSupport, field, required, dateIs, lengthIs, numberIs} from '@xh/hoist/field';
import {wait} from '@xh/hoist/promise';
import {random, isNil} from 'lodash';
import moment from 'moment';

import {action} from '@xh/hoist/mobx';

@HoistModel()
@FieldSupport
export class ValidationPanelModel {

    // TextField / TextArea
    @field(required, lengthIs({max: 20}))
    firstName;

    @field(required, lengthIs({max: 20}))
    lastName;

    @field(required,
        ({value}) => {
            if (isNil(value)) return;
            return wait(100).then(() => {
                if ((!value.includes('@') || !value.includes('.'))) {
                    return 'Backend says this is not a valid email';
                }
            });
        }
    )
    email;

    @field(required, numberIs({min: 10}))
    yearsExperience;

    @field('Hire Date', required, dateIs({min: moment().startOf('day').toDate()}))
    startDate;

    @field('Termination Date')
    endDate;

    constructor() {
        window.mod = this;
        this.validationModel.addRules('endDate', {
            when: (v, {startDate, endDate}) => startDate && endDate,
            check: (v, {startDate, endDate}) => endDate < startDate ? 'Termination Date must be after Hire Date' : null
        });
        this.reset()
    }

    @action
    reset() {
        this.firstName = null;
        this.lastName = null;
        this.email = null;
        this.startDate = new Date();
        this.endDate = new Date();
        this.validationModel.reset();
    }
}