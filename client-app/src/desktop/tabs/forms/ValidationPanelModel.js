
import {HoistModel} from '@xh/hoist/core';
import {dateIs, FormModel, lengthIs, numberIs, required} from '@xh/hoist/cmp/form';
import {wait} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {isNil, isEmpty} from 'lodash';
import moment from 'moment';
import {bindable} from '@xh/hoist/mobx';
import {PendingTaskModel} from '@xh/hoist/utils/async';

@HoistModel
export class ValidationPanelModel {

    validateButtonTask = new PendingTaskModel();

    // For meta controls below example.
    @bindable readonly = false;
    @bindable inline = false;
    @bindable minimal = false;
    @bindable commitOnChange = false;

    validEmail = ({value}) => {
        if (isNil(value)) return;
        return wait(1 * SECONDS).then(() => {
            if ((!value.includes('@') || !value.includes('.'))) {
                return 'Invalid email (async).';
            }
        });
    };

    formModel = new FormModel({
        fields: [{
            name: 'firstName',
            initialValue: 'Joe',
            rules: [required, lengthIs({max: 20})]
        }, {
            name: 'lastName',
            initialValue: 'Bloggs',
            rules: [required, lengthIs({max: 20})]
        }, {
            name: 'email',
            initialValue: 'jbloggs@gmail.com',
            rules: [required, this.validEmail]
        }, {
            name: 'notes',
            initialValue: '',
            rules: [required, lengthIs({max: 300, min: 10})]
        }, {
            name: 'isManager',
            rules: [required]
        }, {
            name: 'yearsExperience',
            rules: [
                numberIs({min: 0, max: 100}),
                {
                    when: (f, {isManager}) => isManager,
                    check: [
                        required,
                        ({value}) => isNil(value) || value < 10 ?  'Managerial positions require at least 10 years of experience.' : null
                    ]
                }
            ]
        }, {
            name: 'startDate',
            displayName: 'Hire Date',
            initialValue: moment().startOf('day').toDate(),
            rules: [required, dateIs({max: 'today'})]
        }, {
            name: 'endDate',
            rules: [
                required,
                dateIs({min: 'today'}),
                {
                    when: ({value, formModel}, {startDate}) => startDate && value,
                    check: ({value, displayName}, {startDate}) => {
                        return value < startDate ? `${displayName} must be after start date.` : null;
                    }
                }
            ]
        }, {
            name: 'region',
            rules: [required]
        }, {
            name: 'tags',
            rules: [required]
        }, {
            name: 'references',
            rules: [(ref) => isEmpty(ref) ? 'At least one reference is required.':  null]
        }]
    });

    addReference() {
        const referencesField = this.formModel.getField('references'),
            references = referencesField.value || [],
            newReference = new FormModel({
                fields: [
                    {name: 'name', rules: [required]},
                    {name: 'relationship'},
                    {name: 'email', rules: [required, this.validEmail]}
                ]
            });

        referencesField.value = [references, ...newReference];
    }

    removeReference(referenceFormModel) {
        const referencesField = this.formModel.getField('references'),
            references = referenceField.value || [];

        referencesField.value = without(reference, referenceFormModel);
        XH.destroy(referenceFormModel)
    }
}
