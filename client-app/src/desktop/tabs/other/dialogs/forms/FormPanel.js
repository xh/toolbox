import {hoistCmp, creates} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, hbox, hframe, vbox, vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {checkbox, dateInput, numberInput, 
    select, textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';

import {FormPanelModel} from './FormPanelModel';

import './FormPanel.scss';

export const formPanel = hoistCmp.factory({
    model: creates(FormPanelModel),

    render({onCloseClick}) {
        return panel({
            className: 'tbox-form-panel',
            height: '100%',
            item: hframe(
                formContent({onCloseClick})
            )
        });
    }
});

const formContent = hoistCmp.factory(
    ({model, onCloseClick}) => panel({
        flex: 1,
        item: form({
            fieldDefaults: {
                inline: model.inline,
                minimal: model.minimal,
                commitOnChange: model.commitOnChange
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
                                items: [
                                    lastName(),
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
        bbar: bbar({onCloseClick})
    })
);

const lastName = hoistCmp.factory(
    () => formField({field: 'lastName', item: textInput({autoFocus: true})})
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

const managerAndYearsExperience = hoistCmp.factory(
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

const references = hoistCmp.factory(
    ({model}) => {
        const {references} = model.formModel.fields,
            rows = references.value.map(
                refModel => form({
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
                })
            );

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

const bbar = hoistCmp.factory(
    ({model, onCloseClick}) => toolbar(
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
            onClick: () => {
                model.submitAsync()
                    .then(outcome => {
                        if (outcome.isValid) onCloseClick();
                    });
            }
        })
    )
);