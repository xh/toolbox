import {HoistModel} from '@xh/hoist/core';
import {FieldSupport, field, required, dateIs, lengthIs, notBlank} from '@xh/hoist/field';
import {wait} from '@xh/hoist/promise';
import {isNil} from 'lodash';
import {SECONDS} from '@xh/hoist/utils/datetime';
import moment from 'moment';

@HoistModel()
@FieldSupport
export class ValidationPanelModel {

    // TextField / TextArea
    @field(required, notBlank, lengthIs({max: 20}))
    firstName;

    @field(required, lengthIs({max: 20}))
    lastName;


    @field(required,
        ({value}) => {
            if (isNil(value)) return;
            return wait(2 * SECONDS).then(() => {
                if ((!value.includes('@') || !value.includes('.'))) {
                    return 'Server report this is not a valid email.';
                }
            });
        }
    )
    email;

    @field('Manager')
    isManager;

    @field()
    yearsExperience;

    @field('Hire Date', required, dateIs({min: moment().startOf('day').toDate()}))
    startDate;

    @field('Completion Date')
    endDate;

    constructor() {
        this.getField('endDate').addRules({
            when: ({value}, {startDate}) => startDate && value,
            check: ({value, displayName}, {startDate}) => value < startDate ? `${displayName} must be after Start Date` : null
        });

        this.getField('yearsExperience').addRules({
            when: (f, {isManager}) => isManager,
            check: [
                required,
                ({value}) => isNil(value) || value < 10 ?  'Managerial Positions require at least 10 years of experience' : null
            ]
        });

        this.initFields({
            isManager: false,
            startDate: moment().toDate()
        });
    }
}