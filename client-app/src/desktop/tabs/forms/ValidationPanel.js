/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, frame, hbox, hframe, vbox, pre} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {form} from '@xh/hoist/cmp/form';
import {
    formField,
    checkbox,
    dateInput,
    numberInput,
    select,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/desktop/cmp/form';

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
        const {formModel, commitOnChange, readonly, inline, minimal} = this.model;

        return frame({
            className: 'toolbox-validation-panel__content',
            item: form({
                model: formModel,
                fieldDefaults: {
                    readonly,
                    inline,
                    minimal
                },
                item: hframe(
                    vbox({
                        width: 300,
                        marginRight: 30,
                        items: [
                            formField({
                                field: 'firstName',
                                item: textInput({commitOnChange})
                            }),
                            formField({
                                field: 'lastName',
                                item: textInput({commitOnChange})
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
                        ]
                    }),
                    vbox({
                        items: [
                            hbox({
                                alignItems: 'center',
                                items: [
                                    formField({
                                        field: 'startDate',
                                        width: 120,
                                        inline: false,
                                        item: dateInput({
                                            commitOnChange
                                        })
                                    }),
                                    Icon.chevronRight({
                                        style: {margin: '0 4px'}
                                    }),
                                    formField({
                                        field: 'endDate',
                                        width: 120,
                                        inline: false,
                                        item: dateInput({
                                            commitOnChange
                                        })
                                    })
                                ]
                            }),
                            formField({
                                field: 'yearsExperience',
                                item: numberInput({width: 50, commitOnChange})
                            }),
                            formField({
                                field: 'isManager',
                                item: checkbox()
                            }),
                            formField({
                                field: 'notes',
                                item: textArea({width: 270, commitOnChange})
                            })
                        ]
                    })
                )
            })
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
                onClick: this.onResetClick
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
