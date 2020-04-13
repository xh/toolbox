import {HoistModel, managed, XH} from '@xh/hoist/core';
import {constrainAll, dateIs, FormModel, lengthIs, numberIs, required, stringExcludes} from '@xh/hoist/cmp/form';
import {wait} from '@xh/hoist/promise';
import {pre, vbox} from '@xh/hoist/cmp/layout';
import {bindable} from '@xh/hoist/mobx';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {Icon} from '@xh/hoist/icon';
import {filter, isEmpty, isNil} from 'lodash';

@HoistModel
export class FormPanelModel {

    @managed
    validateTask = new PendingTaskModel();

    // For meta controls below example.
    @bindable readonly = false;
    @bindable inline = false;
    @bindable minimal = false;
    @bindable commitOnChange = false;

    validEmail = ({value}) => {
        if (isNil(value)) return;
        return wait(500).then(() => {
            if ((!value.includes('@') || !value.includes('.'))) {
                return 'Invalid email (async).';
            }
        });
    };

    @managed
    formModel = new FormModel({
        fields: [
            {
                name: 'firstName',
                initialValue: 'Joe',
                rules: [required, lengthIs({max: 20})]
            },
            {
                name: 'lastName',
                initialValue: 'Bloggs',
                rules: [required, lengthIs({max: 20})]
            },
            {
                name: 'email',
                rules: [required, this.validEmail]
            },
            {
                name: 'notes',
                initialValue: '',
                rules: [required, lengthIs({max: 300, min: 10})]
            },
            {
                name: 'isManager',
                rules: [required]
            },
            {
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
            },
            {
                name: 'startDate',
                displayName: 'Hire Date',
                initialValue: LocalDate.today(),
                rules: [required, dateIs({max: 'today'})]
            },
            {
                name: 'endDate',
                rules: [
                    {
                        when: ({value, formModel}, {startDate}) => startDate && value,
                        check: ({value, displayName}, {startDate}) => {
                            return value < startDate ? `${displayName} must be after start date.` : null;
                        }
                    }
                ]
            },
            {
                name: 'reasonForLeaving'
            },
            {
                name: 'region',
                rules: [required]
            },
            {
                name: 'tags',
                rules: [required, constrainAll(stringExcludes('/', '.', '\\', 'tag'))]
            },
            {
                name: 'references',
                subforms: {
                    fields: [
                        {name: 'name', rules: [required]},
                        {name: 'relationship'},
                        {name: 'email', rules: [required, this.validEmail]}
                    ],
                    initialValues: {relationship: 'professional'}
                },
                rules: [(ref) => isEmpty(ref) ? 'At least one reference is required.':  null]
            }
        ]
    });

    constructor() {
        this.addReaction({
            track: () => this.formModel.values.endDate,
            run: (endDate) => {
                const reasonField = this.formModel.fields.reasonForLeaving;
                if (endDate) {
                    reasonField.setDisabled(false);
                } else {
                    reasonField.setDisabled(true);
                    reasonField.setValue(null);
                }
            },
            fireImmediately: true
        });
    }

    async reset() {
        this.formModel.reset();
    }

    async submitAsync() {
        const {formModel} = this;
        const isValid = await formModel.validateAsync().linkTo(this.validateTask);
        if (isValid) {
            XH.alert({
                message: vbox(
                    'Submitted: ',
                    pre(JSON.stringify(formModel.getData(), undefined, 2))
                )
            });
            this.reset();
        } else {
            const errCount = filter(formModel.fields, f => f.isNotValid).length;
            XH.toast({
                icon: Icon.warning(),
                intent: 'danger',
                message: `Form is not valid. ${errCount} fields are still invalid!`
            });
        }
    }
}