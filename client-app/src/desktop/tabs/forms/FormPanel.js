import React from 'react';
import {hoistComponent, useLocalModel, hoistElemFactory} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, hbox, hframe, vbox, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {checkbox, dateInput, numberInput, select, switchInput, textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {wrapper} from '../../common';
import {FormPanelModel} from './FormPanelModel';

import './FormPanel.scss';

export const FormPanel = hoistComponent(
    () => {
        const model = useLocalModel(FormPanelModel);

        return wrapper({
            description: [
                <p>
                    Forms provide a standard way for validating and editing data. The <code>Form</code> component
                    provides the ability to centrally control certain properties on all its
                    contained <code>FormField</code>s
                    and bind them to a <code>FormModel</code>. The <code>FormModel</code> provides an observable API for
                    loading, validating, and submitting the data to back-end services.
                </p>
            ],
            item: panel({
                title: 'Forms › FormModel',
                className: 'tbox-form-panel',
                icon: Icon.edit(),
                width: 870,
                height: 550,
                item: hframe(
                    formContent({model}),
                    displayOptions({model})
                )
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/FormPanel.js',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/form/Form.js',
                    notes: 'Form Component'
                },
                {
                    url: '$HR/cmp/form/FormModel.js',
                    notes: 'Form Model'
                },
                {
                    url: '$HR/desktop/cmp/form/FormField.js',
                    notes: 'Form Field'
                }
            ]
        });
    }
);

const formContent = hoistElemFactory(
    ({model}) => {
        const {formModel, inline, minimal, commitOnChange} = model;

        return panel({
            flex: 1,
            item: form({
                model: formModel,
                fieldDefaults: {
                    inline,
                    minimal,
                    commitOnChange
                },
                item: vframe({
                    padding: 10,
                    items: [
                        hbox({
                            flex: 'none',
                            items: [
                                vbox({
                                    flex: 1,
                                    marginRight: 30,
                                    items: renderLeftFields(model)
                                }),
                                vbox({
                                    flex: 1,
                                    items: renderRightFields(model)
                                })
                            ]
                        }),
                        'References',
                        references({model})
                    ]
                })
            }),
            bbar: bbar({model})
        });
    }
);

function renderLeftFields(model) {
    return [
        formField({
            field: 'lastName',
            item: textInput()
        }),
        formField({
            field: 'email',
            item: textInput({
                placeholder: 'user@company.com',
                leftIcon: Icon.mail(),
                enableClear: true
            })
        }),
        formField({
            field: 'region',
            item: select({
                options: ['California', 'London', 'Montreal', 'New York']
            })
        }),
        formField({
            field: 'tags',
            item: select({
                enableMulti: true,
                enableCreate: true
            })
        })
    ];
}

function renderRightFields(model) {
    return [
        hbox(
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
        ),
        formField({
            field: 'reasonForLeaving',
            item: select({
                options: ['New Job', 'Retirement', 'Terminated', 'Other']
            })
        }),
        hbox({
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
        }),
        formField({
            field: 'notes',
            item: textArea({height: 100})
        })
    ];
}

const references = hoistElemFactory(
    ({model}) => {
        const {references} = model.formModel.fields;
        const rows = references.value.map(refModel => {
            return form({
                model: refModel,
                key: refModel.xhId,
                fieldDefaults: {label: null},
                item: hbox({
                    className: 'tbox-form-panel__reference-row',
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
                            onClick: () => references.remove(refModel)
                        })
                    ]
                })
            });
        });

        return vbox({
            className: 'tbox-form-panel__references',
            items: [
                ...rows,
                button({
                    icon: Icon.add(),
                    text: 'Add new reference...',
                    onClick: () => references.add()
                })
            ]
        });
    }
);

const displayOptions = hoistElemFactory(
    ({model}) => {
        const {formModel} = model;

        return panel({
            title: 'Display Options',
            className: 'tbox-display-opts',
            icon: Icon.settings(),
            compactHeader: true,
            items: [
                switchInput({
                    model,
                    bind: 'inline',
                    label: 'Inline labels'
                }),
                switchInput({
                    model,
                    bind: 'minimal',
                    label: 'Minimal validation display'
                }),
                switchInput({
                    model,
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
            ],
            model: {side: 'right', defaultSize: 220, resizable: false}
        });
    }
);

const bbar = hoistElemFactory(
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
