import {form, formFieldSet} from '@xh/hoist/cmp/form';
import {box, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    checkbox,
    dateInput,
    numberInput,
    select,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import type {SubformsFieldModel} from '@xh/hoist/cmp/form';
import {Icon} from '@xh/hoist/icon';
import {isNil} from 'lodash';
import {wrapper, wrapperOption} from '../../common/Wrapper';
import './FormPanel.scss';
import {FormPanelModel} from './FormPanelModel';
import {badge} from '@xh/hoist/cmp/badge';

export const formPanel = hoistCmp.factory({
    model: creates(FormPanelModel),
    className: 'tb-form-panel',

    render({className, model}) {
        const {formModel} = model;
        return wrapper({
            title: 'FormModel',
            icon: Icon.edit(),
            description: [
                'Forms provide a standard way for validating and editing data. The `Form`',
                'component provides the ability to centrally control certain properties on all',
                'its contained `FormField`s and bind them to a `FormModel`. The `FormModel`',
                'provides an observable API for loading, validating, and submitting the data',
                'to back-end services.',
                '',
                'This example also demonstrates customizing the style of `FormField` via CSS',
                'variables.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/FormPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/form/README.md#formmodel',
                    text: 'Form docs',
                    notes: 'Form infrastructure guide and validation concepts.'
                },
                {url: '$HR/cmp/form/Form.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/form/FormModel.ts',
                    notes: 'Observable model for loading, validating, and submitting form data.'
                },
                {
                    url: '$HR/desktop/cmp/form/FormField.ts',
                    notes: 'Binds an input to a FormModel field, with label and validation display.'
                }
            ],
            options: [
                wrapperOption({
                    label: 'Commit on change',
                    propName: 'FormFieldProps.commitOnChange',
                    control: switchInput({model, bind: 'commitOnChange'}),
                    info: 'Commit on each keystroke, not on blur.'
                }),
                wrapperOption({
                    label: 'Inline labels',
                    propName: 'FormFieldProps.inline',
                    control: switchInput({model, bind: 'inline'})
                }),
                wrapperOption({
                    label: 'Minimal validation',
                    propName: 'FormFieldProps.minimal',
                    control: switchInput({model, bind: 'minimal'}),
                    info: 'Show errors as a red outline only.'
                }),
                wrapperOption({
                    label: 'US date formats',
                    control: switchInput({model, bind: 'usDateFormat'})
                }),
                wrapperOption({
                    label: 'Disabled',
                    propName: 'FormModel.disabled',
                    control: switchInput({model: formModel, bind: 'disabled'})
                }),
                wrapperOption({
                    label: 'Read-only',
                    propName: 'FormModel.readonly',
                    control: switchInput({model: formModel, bind: 'readonly'})
                })
            ],
            children: panel({
                className,
                // Flex within a range rather than pinning to 950, which clipped once the demo
                // region was narrower than that. The floor keeps the fields legible; below it the
                // wrapper scrolls.
                width: '100%',
                maxWidth: 950,
                minWidth: 360,
                height: 575,
                children: formContent()
            })
        });
    }
});

const formContent = hoistCmp.factory<FormPanelModel>(({model}) =>
    panel({
        scrollable: true,
        contentBoxProps: {padding: true, gap: true},
        children: form({
            fieldDefaults: {
                inline: model.inline,
                minimal: model.minimal,
                commitOnChange: model.commitOnChange,
                readonlyRenderer: v =>
                    isNil(v) ? span({children: 'N/A', className: 'xh-text-color-muted'}) : `${v}`
            },
            children: [
                formFieldSet({
                    icon: Icon.user(),
                    title: 'Candidate',
                    contentBoxProps: {flexDirection: 'row', flexWrap: 'wrap', gap: true},
                    children: [
                        formFieldSet({
                            children: [firstAndLastNames(), fullName(), email(), region(), tags()],
                            flex: '1 1 300px'
                        }),
                        formFieldSet({
                            children: [
                                startAndEndDate(),
                                reasonForLeaving(),
                                managerAndYearsExperience(),
                                notes()
                            ],
                            flex: '1 1 300px'
                        })
                    ]
                }),
                formFieldSet({
                    modelConfig: {collapsible: true},
                    icon: Icon.phone(),
                    title: span('References ', badge(model.formModel.values.references.length)),
                    children: references()
                })
            ]
        }),
        bbar: bbar()
    })
);

const firstAndLastNames = hoistCmp.factory<FormPanelModel>(({model}) => {
    const flex = model.inline ? null : 1;
    return box({
        flexDirection: model.inline ? 'column' : 'row',
        children: [
            formField({
                field: 'firstName',
                flex,
                children: textInput()
            }),
            formField({
                field: 'lastName',
                flex,
                children: textInput()
            })
        ]
    });
});

// Readonly field - does not require an item
const fullName = hoistCmp.factory(() => formField({field: 'fullName'}));

const email = hoistCmp.factory(() =>
    formField({
        field: 'email',
        children: textInput({
            placeholder: 'user@company.com',
            leftIcon: Icon.mail(),
            enableClear: true
        })
    })
);

const region = hoistCmp.factory(() =>
    formField({
        field: 'region',
        children: select({
            options: ['California', 'London', 'Montreal', 'New York']
        })
    })
);

const tags = hoistCmp.factory(() =>
    formField({
        field: 'tags',
        children: select({
            enableMulti: true,
            enableCreate: true
        })
    })
);

const startAndEndDate = hoistCmp.factory<FormPanelModel>(({model}) => {
    const flex = model.inline ? null : 1,
        dateFormatProps = model.usDateFormat
            ? {parseStrings: ['MM/DD/YY', 'MM/DD/YYYY'], formatString: 'MM/DD/YYYY'}
            : {};
    return box({
        flexDirection: model.inline ? 'column' : 'row',
        children: [
            formField({
                field: 'startDate',
                flex,
                children: dateInput({
                    valueType: 'localDate',
                    width: 150,
                    ...dateFormatProps
                })
            }),
            formField({
                field: 'endDate',
                flex,
                children: dateInput({
                    valueType: 'localDate',
                    width: 150,
                    enableClear: true,
                    ...dateFormatProps
                })
            })
        ]
    });
});

const reasonForLeaving = hoistCmp.factory(() =>
    formField({
        field: 'reasonForLeaving',
        children: select({
            options: ['New Job', 'Retirement', 'Terminated', 'Other']
        })
    })
);

const managerAndYearsExperience = hoistCmp.factory<FormPanelModel>(({model}) => {
    return box({
        flexDirection: model.inline ? 'column' : 'row',
        children: [
            formField({
                field: 'isManager',
                label: 'Manager?',
                width: 100,
                flex: 'none',
                children: checkbox(),
                readonlyRenderer: v => (v ? 'Yes' : 'No')
            }),
            formField({
                field: 'yearsExperience',
                children: numberInput({width: 50})
            })
        ]
    });
});

const notes = hoistCmp.factory(() =>
    formField({
        field: 'notes',
        children: textArea({height: 100})
    })
);

const references = hoistCmp.factory<FormPanelModel>(({model}) => {
    const {formModel} = model,
        references = formModel.fields.references as SubformsFieldModel,
        disableButtons = formModel.disabled || formModel.readonly,
        rows = references.value.map(refModel =>
            form({
                model: refModel,
                fieldDefaults: {label: null},
                children: hbox({
                    className: 'tb-form-panel__reference-row',
                    children: [
                        formField({
                            field: 'name',
                            flex: 1,
                            children: textInput({placeholder: 'Full name'})
                        }),
                        formField({
                            field: 'email',
                            flex: 1,
                            children: textInput({placeholder: 'Email'})
                        }),
                        formField({
                            field: 'relationship',
                            flex: 1,
                            children: select({
                                options: [
                                    {value: 'professional', label: 'Professional Contact'},
                                    {value: 'personal', label: 'Personal Contact'}
                                ]
                            })
                        }),
                        button({
                            icon: Icon.delete(),
                            intent: 'danger',
                            disabled: disableButtons,
                            alignSelf: 'start',
                            marginTop: 'var(--xh-form-field-padding)',
                            onClick: () => references.remove(refModel)
                        })
                    ]
                })
            })
        );

    return vbox({
        className: 'tb-form-panel__references',
        children: [
            ...rows,
            button({
                icon: Icon.add(),
                text: 'Add new reference...',
                disabled: disableButtons,
                onClick: () => references.add()
            })
        ]
    });
});

const bbar = hoistCmp.factory<FormPanelModel>(({model}) =>
    toolbar(
        button({
            text: 'Reset',
            icon: Icon.reset({className: 'xh-red'}),
            onClick: () => model.reset(),
            disabled: !model.formModel.isDirty
        }),
        filler(),
        button({
            text: 'Submit',
            icon: Icon.check(),
            minimal: false,
            intent: 'success',
            onClick: () => model.submitAsync()
        })
    )
);
