import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import {FormModel} from '@xh/hoist/cmp/form';
import {
    constrainAll,
    dateIs,
    lengthIs,
    numberIs,
    required,
    stringExcludes,
    validEmail
} from '@xh/hoist/data';
import {pre, vbox} from '@xh/hoist/cmp/layout';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {Icon} from '@xh/hoist/icon';
import {filter, isEmpty} from 'lodash';

export class FormPanelModel extends HoistModel {
    @managed
    validateTask = TaskObserver.trackLast();

    // For meta controls below example.
    @bindable inline = false;
    @bindable minimal = false;
    @bindable commitOnChange = false;

    @managed
    formModel = new FormModel({
        fields: [
            {
                name: 'firstName',
                initialValue: 'Hoist',
                rules: [required, lengthIs({max: 20})]
            },
            {
                name: 'lastName',
                initialValue: 'Developer',
                rules: [required, lengthIs({max: 20})]
            },
            {
                name: 'email',
                initialValue: 'support@xh.io',
                rules: [required, validEmail]
            },
            {
                name: 'notes',
                rules: [required, lengthIs({max: 300, min: 10})]
            },
            {
                name: 'isManager',
                initialValue: false,
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
                            ({value}) => {
                                if (value < 10) {
                                    return {
                                        severity: 'error',
                                        message:
                                            'Managerial positions require at least 10 years of experience.'
                                    };
                                } else if (value < 15) {
                                    return {
                                        severity: 'warning',
                                        message: '15+ years of experience recommended for role.'
                                    };
                                }
                            }
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
                            return value < startDate
                                ? `${displayName} must be after start date.`
                                : null;
                        }
                    }
                ]
            },
            {
                name: 'reasonForLeaving'
            },
            {
                name: 'region',
                rules: [
                    required,
                    ({value}) =>
                        ['London', 'Montreal'].includes(value)
                            ? {
                                  severity: 'warning',
                                  message: 'Region is outside primary operating areas.'
                              }
                            : null
                ]
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
                        {name: 'email', rules: [required, validEmail]}
                    ],
                    initialValues: {relationship: 'professional'}
                },
                rules: [ref => (isEmpty(ref) ? 'At least one reference is required.' : null)]
            }
        ]
    });

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => this.formModel.values.endDate,
            run: endDate => {
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
                message: vbox('Submitted: ', pre(JSON.stringify(formModel.getData(), undefined, 2)))
            });
            this.reset();
        } else {
            const errCount = filter(formModel.fields, f => f.isNotValid).length;
            XH.toast({
                icon: Icon.warning(),
                intent: 'danger',
                message: `Cannot submit your form - ${errCount} fields failed to pass validation.`
            });
        }
    }
}
