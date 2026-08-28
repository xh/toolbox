import {FormModel} from '@xh/hoist/cmp/form';
import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import {dateIs, lengthIs, numberIs, required, validEmail} from '@xh/hoist/data';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {filter} from 'lodash';

export class FormPageModel extends HoistModel {
    // Display options, bound to the example sheet.
    @bindable accessor minimal: boolean = false;
    @bindable accessor commitOnChange: boolean = false;
    @bindable accessor requiredMarkers: boolean = true;
    @bindable accessor density: 'comfortable' | 'compact' = 'comfortable';

    @managed
    validateTask = TaskObserver.trackLast();

    readonly regionOptions = ['California', 'London', 'Montreal', 'New York'];
    readonly reasonOptions = ['New Job', 'Retirement', 'Terminated', 'Other'];

    @managed
    formModel: FormModel = new FormModel({
        fields: [
            {name: 'firstName', rules: [required, lengthIs({max: 20})]},
            {name: 'lastName', rules: [required, lengthIs({max: 20})]},
            {name: 'fullName', readonly: true},
            {
                name: 'email',
                initialValue: 'support@xh.io',
                rules: [required, validEmail]
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
                name: 'startDate',
                displayName: 'Hire Date',
                initialValue: LocalDate.today(),
                rules: [required, dateIs({max: 'today'})]
            },
            {
                name: 'endDate',
                rules: [
                    {
                        when: ({value}, {startDate}) => startDate && value,
                        check: ({value, displayName}, {startDate}) =>
                            value < startDate ? `${displayName} must be after the hire date.` : null
                    }
                ]
            },
            {name: 'reasonForLeaving'},
            {name: 'isManager', initialValue: false, rules: [required]},
            {
                name: 'yearsExperience',
                rules: [
                    numberIs({min: 0, max: 100}),
                    ({value}) =>
                        value > 50
                            ? {severity: 'info', message: 'You have extensive experience!'}
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
                                return null;
                            }
                        ]
                    }
                ]
            },
            {name: 'notes', rules: [required, lengthIs({min: 10, max: 300})]},
            {name: 'employeeId', displayName: 'Employee (using ID)', initialValue: 99}
        ]
    });

    constructor() {
        super();

        const {formModel} = this;
        this.addReaction(
            {
                track: () => [formModel.values.firstName, formModel.values.lastName],
                run: ([firstName, lastName]) => {
                    formModel.setValues({
                        fullName: `${firstName ?? '[???]'} ${lastName ?? '[???]'}`
                    });
                },
                fireImmediately: true
            },
            {
                track: () => formModel.values.endDate,
                run: endDate => {
                    const reasonField = formModel.fields.reasonForLeaving;
                    reasonField.setDisabled(!endDate);
                    if (!endDate) reasonField.setValue(null);
                },
                fireImmediately: true
            }
        );
    }

    async submitAsync() {
        const {formModel} = this,
            isValid = await formModel.validateAsync().linkTo(this.validateTask);

        if (isValid) {
            XH.alert({
                title: 'Submitted',
                icon: Icon.check(),
                message: `Thanks, ${formModel.values.fullName}. Your candidate form was submitted.`
            });
            formModel.reset();
        } else {
            const errCount = filter(formModel.fields, f => f.isNotValid).length;
            XH.dangerToast(`Cannot submit - ${errCount} field(s) failed validation.`);
        }
    }

    // All of the records to power the select options and generateOptionFn.
    get employees(): any[] {
        return [
            {id: 1, name: 'Alice Chen', isActive: true},
            {id: 2, name: 'Bob Park', isActive: true},
            {id: 3, name: 'Carol Diaz', isActive: true},
            {id: 4, name: 'Dave Kim', isActive: false},
            {id: 5, name: 'Eve Singh', isActive: true},
            {id: 6, name: 'Fred Rogers', isActive: true},
            {id: 99, name: 'Zara Quinn', isActive: false}
        ];
    }

    // Only some of the employee records are selectable.
    get selectableEmployees() {
        return this.employees.filter(it => it.isActive);
    }

    // Lookup returns both selectable and not-selectable records.
    lookupEmployeeById(id: number) {
        return this.employees.find(it => it.id === id);
    }
}
