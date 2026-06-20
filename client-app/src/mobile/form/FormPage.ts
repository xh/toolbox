import {form, formFieldSet} from '@xh/hoist/cmp/form';
import {vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {formField} from '@xh/hoist/mobile/cmp/form';
import {
    dateInput,
    numberInput,
    segmentedControl,
    select,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {exampleAction, exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './FormPage.scss';
import {FormPageModel} from './FormPageModel';

export const formPage = hoistCmp.factory({
    model: creates(FormPageModel),

    render({model}) {
        return exampleScreen({
            title: 'Form',
            icon: Icon.edit(),
            description: [
                "Hoist's `FormModel` binds inputs to observable state with built-in validation - here a",
                'mock candidate intake form. Required, length, email, date, and numeric rules run live,',
                'with conditional rules (years of experience is required, with a higher bar, only for',
                'managers) and cross-field rules (end date must follow the hire date).',
                '',
                '`FormFieldSet` groups related fields into collapsible sections. Use the options here to',
                'change how validation and the fields are displayed.'
            ],
            options: [
                exampleOption({
                    label: 'Read-only',
                    control: switchInput({model: model.formModel, bind: 'readonly'})
                }),
                exampleOption({
                    label: 'Minimal validation',
                    control: switchInput({model, bind: 'minimal'}),
                    info: 'Show errors as a red outline only.'
                }),
                exampleOption({
                    label: 'Commit on change',
                    control: switchInput({model, bind: 'commitOnChange'})
                }),
                exampleOption({
                    label: 'Required markers',
                    control: switchInput({model, bind: 'requiredMarkers'})
                }),
                exampleOption({
                    label: 'Density',
                    control: segmentedControl({
                        model,
                        bind: 'density',
                        fill: false,
                        options: [
                            {value: 'comfortable', label: 'Comfortable'},
                            {value: 'compact', label: 'Compact'}
                        ]
                    })
                }),
                exampleAction({
                    text: 'Submit',
                    icon: Icon.check(),
                    intent: 'success',
                    onClick: () => model.submitAsync()
                }),
                exampleAction({
                    text: 'Reset',
                    icon: Icon.reset(),
                    onClick: () => model.formModel.reset()
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/form/FormPage.ts', notes: 'This example.'},
                {
                    url: '$HR/cmp/form/README.md#formmodel',
                    text: 'Forms docs',
                    notes: 'FormModel, validation & binding.'
                },
                {url: '$HR/cmp/form/FormModel.ts', notes: 'Observable model for form data.'},
                {
                    url: '$HR/mobile/cmp/form/FormField.ts',
                    notes: 'Binds an input to a FormModel field, with label and validation display.'
                }
            ],
            item: formDemo()
        });
    }
});

const formDemo = hoistCmp.factory<FormPageModel>(({model}) => {
    const {minimal, commitOnChange, requiredMarkers, density} = model;
    return panel({
        scrollable: true,
        className: `tb-form-page tb-form-page--${density}`,
        item: form({
            fieldDefaults: {
                minimal,
                commitOnChange,
                requiredIndicator: requiredMarkers ? '*' : ''
            },
            items: vbox(
                formFieldSet({
                    title: 'Candidate Details',
                    modelConfig: {collapsible: true},
                    items: [
                        formField({field: 'firstName', item: textInput({enableClear: true})}),
                        formField({field: 'lastName', item: textInput({enableClear: true})}),
                        formField({field: 'fullName'}),
                        formField({
                            field: 'email',
                            item: textInput({
                                leftIcon: Icon.mail(),
                                enableClear: true,
                                placeholder: 'user@company.com'
                            })
                        }),
                        formField({
                            field: 'region',
                            item: select({
                                placeholder: 'Select a region...',
                                options: model.regionOptions
                            })
                        })
                    ]
                }),
                formFieldSet({
                    className: 'xh-margin-top',
                    title: 'Employment',
                    modelConfig: {collapsible: true},
                    items: [
                        formField({
                            field: 'startDate',
                            item: dateInput({
                                valueType: 'localDate',
                                maxDate: LocalDate.today()
                            })
                        }),
                        formField({
                            field: 'endDate',
                            item: dateInput({valueType: 'localDate', enableClear: true})
                        }),
                        formField({
                            field: 'reasonForLeaving',
                            item: select({
                                placeholder: 'Select a reason...',
                                options: model.reasonOptions
                            })
                        }),
                        formField({field: 'isManager', item: switchInput()}),
                        formField({
                            field: 'yearsExperience',
                            item: numberInput({min: 0, max: 100})
                        }),
                        formField({field: 'notes', item: textArea()})
                    ]
                })
            )
        })
    });
});
