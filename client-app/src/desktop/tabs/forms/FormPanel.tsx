import {form} from '@xh/hoist/cmp/form';
import {div, filler, hbox, hframe, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {checkbox, dateInput, numberInput, select, switchInput, textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {SubformsFieldModel} from '@xh/hoist/cmp/form';
import {Icon} from '@xh/hoist/icon';
import {isNil} from 'lodash';
import React from 'react';
import {wrapper} from '../../common';
import './FormPanel.scss';
import {FormPanelModel} from './FormPanelModel';

export const formPanel = hoistCmp.factory({
    model: creates(FormPanelModel),

    render() {
        return wrapper({
            description: [
                <p>
                    Forms provide a standard way for validating and editing data. The <code>Form</code> component
                    provides the ability to centrally control certain properties on all its
                    contained <code>FormField</code>s
                    and bind them to a <code>FormModel</code>. The <code>FormModel</code> provides an observable API
                    for
                    loading, validating, and submitting the data to back-end services.
                </p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/forms/FormPanel.tsx', notes: 'This example.'},
                {url: '$HR/cmp/form/Form.ts', notes: 'Form Component'},
                {url: '$HR/cmp/form/FormModel.ts', notes: 'Form Model'},
                {url: '$HR/desktop/cmp/form/FormField.ts', notes: 'Form Field'}
            ],
            item: panel({
                title: 'Forms › FormModel',
                className: 'tb-form-panel',
                icon: Icon.edit(),
                width: 870,
                height: 550,
                item: hframe(
                    formContent(),
                    displayOptions()
                )
            })
        });
    }
});

const formContent = hoistCmp.factory<FormPanelModel>(
    ({model}) => panel({
        flex: 1,
        item: form({
            fieldDefaults: {
                inline: model.inline,
                minimal: model.minimal,
                commitOnChange: model.commitOnChange,
                readonlyRenderer: v => isNil(v) ? span({item: 'N/A', className: 'xh-text-color-muted'}) : `${v}`
            },
            item: div({
                className: 'tb-form-panel__inner-scroll',
                items: [
                    hbox({
                        flex: 'none',
                        items: [
                            vbox({
                                flex: 1,
                                marginRight: 30,
                                items: [
                                    hbox(
                                        formField({field: 'firstName', item: textInput()}),
                                        formField({field: 'lastName', item: textInput()})
                                    ),
                                    region(),
                                    email(),
                                    tags()
                                ]
                            }),
                            vbox({
                                flex: 1,
                                items: [
                                    startAndEndDate(),
                                    reasonForLeaving(),
                                    managerAndYearsExperience(),
                                    notes()
                                ]
                            })
                        ]
                    }),
                    'References',
                    references()
                ]
            })
        }),
        bbar: bbar()
    })
);

const email = hoistCmp.factory(
    () => formField({
        field: 'email',
        item: textInput({
            placeholder: 'user@company.com',
            leftIcon: Icon.mail(),
            enableClear: true
        })
    })
);

const region = hoistCmp.factory(
    () => formField({
        field: 'region',
        item: select({
            options: ['California', 'London', 'Montreal', 'New York']
        })
    })
);

const tags = hoistCmp.factory(
    () => formField({
        field: 'tags',
        item: select({
            enableMulti: true,
            enableCreate: true
        })
    })
);

const startAndEndDate = hoistCmp.factory(
    () => hbox(
        formField({
            field: 'startDate',
            flex: 1,
            inline: false,  // always print labels on top (override form-level inline)
            item: dateInput({
                valueType: 'localDate'
            })
        }),
        formField({
            field: 'endDate',
            flex: 1,
            inline: false,
            item: dateInput({
                valueType: 'localDate',
                enableClear: true
            })
        })
    )
);

const reasonForLeaving = hoistCmp.factory(
    () => formField({
        field: 'reasonForLeaving',
        item: select({
            options: ['New Job', 'Retirement', 'Terminated', 'Other']
        })
    })
);

const managerAndYearsExperience = hoistCmp.factory<FormPanelModel>(
    ({model}) => hbox({
        items: [
            formField({
                field: 'isManager',
                label: 'Manager?',
                item: checkbox()
            }),
            formField({
                field: 'yearsExperience',
                item: numberInput({width: 50})
            })
        ],
        alignItems: model.inline ? 'center' : 'top'
    })
);

const notes = hoistCmp.factory(
    () => formField({
        field: 'notes',
        item: textArea({height: 100})
    })
);

const references = hoistCmp.factory<FormPanelModel>(
    ({model}) => {
        const {formModel} = model,
            references = formModel.fields.references as SubformsFieldModel,
            disableButtons = formModel.disabled || formModel.readonly,
            rows = references.value.map(
                refModel => form({
                    model: refModel,
                    key: refModel.xhId,
                    fieldDefaults: {label: null},
                    item: hbox({
                        className: 'tb-form-panel__reference-row',
                        items: [
                            formField({
                                field: 'name',
                                flex: 1,
                                item: textInput({placeholder: 'Full name'})
                            }),
                            formField({
                                field: 'email',
                                flex: 1,
                                item: textInput({placeholder: 'Email'})
                            }),
                            formField({
                                field: 'relationship',
                                flex: 1,
                                item: select({
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
                                onClick: () => references.remove(refModel)
                            })
                        ]
                    })
                })
            );

        return vbox({
            className: 'tb-form-panel__references',
            items: [
                ...rows,
                button({
                    icon: Icon.add(),
                    text: 'Add new reference...',
                    disabled: disableButtons,
                    onClick: () => references.add()
                })
            ]
        });
    }
);

const displayOptions = hoistCmp.factory<FormPanelModel>(
    ({model}) => {
        const {formModel} = model;
        return panel({
            title: 'Display Options',
            className: 'tbox-display-opts',
            icon: Icon.settings(),
            compactHeader: true,
            modelConfig: {side: 'right', defaultSize: 220, resizable: false},
            item: div({
                className: 'tbox-display-opts__inner',
                items: [
                    switchInput({
                        bind: 'inline',
                        label: 'Inline labels'
                    }),
                    switchInput({
                        bind: 'minimal',
                        label: 'Minimal validation display'
                    }),
                    switchInput({
                        bind: 'commitOnChange',
                        label: 'Commit on change'
                    }),
                    switchInput({
                        model: formModel,
                        bind: 'readonly',
                        label: 'Read-only'
                    }),
                    switchInput({
                        model: formModel,
                        bind: 'disabled',
                        label: 'Disabled'
                    })
                ]
            })
        });
    }
);

const bbar = hoistCmp.factory<FormPanelModel>(
    ({model}) => toolbar(
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
