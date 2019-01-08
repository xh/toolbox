/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, frame, hbox, vspacer, vbox, pre} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {form} from '@xh/hoist/cmp/form';
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

import {wrapper} from '../../common';
import {ValidationPanelModel} from './ValidationPanelModel';

import './ValidationPanel.scss';

@HoistComponent
export class ValidationPanel extends Component {

    model = new ValidationPanelModel();

    render() {
        return wrapper(
            panel({
                title: 'Validation',
                className: 'toolbox-validation-panel',
                icon: Icon.edit(),
                width: '90%',
                height: '90%',
                mask: this.validateButtonTask,
                item: this.renderForm(),
                bbar: this.renderToolbar()
            })
        );
    }

    renderForm() {
        const {formModel, readonly, inline, minimal, commitOnChange} = this.model;

        return frame({
            className: 'toolbox-validation-panel__content',
            item: form({
                model: formModel,
                fieldDefaults: {
                    readonly,
                    inline,
                    minimal,
                    commitOnChange
                },
                item: vbox(
                    hbox(
                        vbox({
                            width: 300,
                            marginRight: 30,
                            items: this.renderLeftFields()
                        }),
                        vbox({
                            items: this.renderRightFields()
                        })
                    ),
                    this.renderReferences()
                )
            })
        });
    }

    renderLeftFields() {
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

    renderRightFields() {
        return [
            hbox({
                alignItems: 'top',
                items: [
                    formField({
                        field: 'startDate',
                        width: 120,
                        inline: false,
                        item: dateInput()
                    }),
                    formField({
                        field: 'endDate',
                        width: 120,
                        inline: false,
                        item: dateInput()
                    })
                ]
            }),
            formField({
                field: 'yearsExperience',
                item: numberInput({width: 50})
            }),
            formField({
                field: 'isManager',
                item: checkbox()
            }),
            formField({
                field: 'notes',
                item: textArea({width: 270})
            })
        ];
    }


    renderReferences() {
        const {model} = this,
            {formModel} = model,
            references = formModel.getField('references').value || [];

        const rows = references.map(refModel => {
            return form({
                model: refModel,
                key: refModel.xhId,
                item: hbox(
                    formField({
                        field: 'name',
                        item: textInput()
                    }),
                    formField({
                        field: 'relationship',
                        item: textInput()
                    }),
                    formField({
                        field: 'email',
                        item: textInput()
                    }),
                    button({
                        icon: Icon.delete(),
                        onClick: () => model.removeReference(refModel)
                    })
                )
            });
        });
        
        return vbox({
            alignItems: 'flex-start',
            items: [
                'References',
                ...rows,
                vspacer(5),
                button({
                    icon: Icon.add(),
                    text: 'Add',
                    onClick: () => model.addReference()
                })
            ]
        });
    }

    renderToolbar() {
        const {model} = this;
        return toolbar(
            switchInput({
                model,
                field: 'inline',
                label: 'Display field labels inline'
            }),
            switchInput({
                model,
                field: 'readonly',
                label: 'Read-only mode'
            }),
            switchInput({
                model,
                field: 'minimal',
                label: 'Minimal validation display'
            }),
            switchInput({
                model,
                field: 'commitOnChange',
                label: 'Inputs commit on change'
            }),
            filler(),
            toolbarSep(),
            button({
                text: 'Reset',
                icon: Icon.undo(),
                onClick: this.onResetClick,
                disabled: !model.formModel.isDirty
            }),
            button({
                text: 'Validate',
                icon: Icon.check(),
                intent: 'primary',
                onClick: this.onValidateClick
            }),
            button({
                text: 'Submit',
                icon: Icon.add(),
                intent: 'success',
                onClick: this.onSubmitClick,
                disabled: !model.formModel.isValid
            })
        );
    }


    onSubmitClick = async () => {
        const {formModel} = this.model;
        await formModel.validateAsync().linkTo(this.validateButtonTask);
        if (formModel.isValid) {
            XH.alert({
                message: vbox(
                    'Submitted: ',
                    pre(JSON.stringify(formModel.getData(), undefined, 2))
                )
            });
            formModel.reset();
        }
    }

    onValidateClick = async () => {
        const {formModel} = this.model;
        await formModel.validateAsync().linkTo(this.validateButtonTask);
        if (formModel.isValid) {
            XH.toast({message: 'Form is valid'});
        } else {
            const errCount = formModel.fields.filter(f => f.isNotValid).length;
            XH.toast({
                icon: Icon.warning(),
                intent: 'danger',
                message: `Form is not valid. ${errCount} fields are still invalid!`
            });
        }
    }

    onResetClick = () => {
        this.model.formModel.reset();
    }
}
