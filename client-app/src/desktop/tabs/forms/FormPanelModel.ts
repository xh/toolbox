import {FormModel} from '@xh/hoist/cmp/form';
import {pre, vbox} from '@xh/hoist/cmp/layout';
import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import {
    constrainAll,
    dateIs,
    lengthIs,
    numberIs,
    required,
    stringExcludes,
    validEmail
} from '@xh/hoist/data';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {isEmpty} from 'lodash';

export class FormPanelModel extends HoistModel {
    @managed
    validateTask = TaskObserver.trackLast();

    // For meta controls below example.
    @bindable inline: boolean = false;
    @bindable minimal: boolean = false;
    @bindable commitOnChange: boolean = true;

    @managed
    formModel = new FormModel({
        fields: [
            {
                name: 'firstName',
                rules: [required, lengthIs({max: 20})]
            },
            {
                name: 'lastName',
                rules: [required, lengthIs({max: 20})]
            },
            {
                name: 'fullName',
                readonly: true
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
                    ({value}) =>
                        value > 50
                            ? {
                                  severity: 'info',
                                  message: 'You have extensive experience!'
                              }
                            : null,
                    {
                        when: (f, {isManager}) => isManager,
                        check: [
                            required,
                            ({value}) => {
                                if (value < 10) {
                                    return {
                                        severity: 'error',
                                        message: '10+ years required for managers.'
                                    };
                                }
                                if (value < 15) {
                                    return {
                                        severity: 'warning',
                                        message: '15+ years recommended for managers.'
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

        const {formModel} = this;
        this.addReaction(
            {
                track: () => formModel.values.endDate,
                run: endDate => {
                    const reasonField = formModel.fields.reasonForLeaving;
                    if (endDate) {
                        reasonField.setDisabled(false);
                    } else {
                        reasonField.setDisabled(true);
                        reasonField.setValue(null);
                    }
                },
                fireImmediately: true
            },
            {
                track: () => [formModel.values.firstName, formModel.values.lastName],
                run: ([firstName, lastName]) => {
                    formModel.setValues({
                        fullName: `${firstName ?? '[???]'} ${lastName ?? '[???]'}`
                    });
                }
            }
        );
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
            const allErrors = formModel.allErrors;
            XH.toast({
                icon: Icon.warning(),
                intent: 'danger',
                message: `Cannot submit your form - ${allErrors.length} fields failed to pass validation.`
            });
        }
    }
}
