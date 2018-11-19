/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, hbox, hframe, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {form} from '@xh/hoist/cmp/form';
import {bindable} from '@xh/hoist/mobx';
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

    localModel = new ValidationPanelModel();

    validateButtonTask = new PendingTaskModel();

    // For meta controls below example.
    @bindable minimal = false;
    @bindable commitOnChange = true;

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
        const {model, commitOnChange, minimal} = this;

        return form({
            model,
            fieldDefaults: {minimal},
            item: hframe({
                className: 'toolbox-validation-panel__content',
                items: [
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
                                    rightElement: button({
                                        icon: Icon.cross(),
                                        minimal: true,
                                        onClick: () => model.setEmail(null)
                                    })
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
                                        item: dateInput({
                                            width: 120,
                                            commitOnChange
                                        })
                                    }),
                                    Icon.chevronRight({
                                        style: {margin: '0 4px'}
                                    }),
                                    formField({
                                        field: 'endDate',
                                        item: dateInput({
                                            width: 120,
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
                ]
            })
        });
    }

    renderToolbar() {
        return toolbar(
            switchInput({
                model: this,
                field: 'displayMinimal',
                label: 'Minimal validation display'
            }),
            switchInput({
                model: this,
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
                disabled: !this.model.isValid
            })
        );
    }


    onSubmitClick = async () => {
        const {model} = this;
        await model.validateAsync().linkTo(this.validateButtonTask);
        if (model.isValid) {
            XH.toast({message: 'User successfully submitted.'});
            model.resetFields();
        }
    }

    onValidateClick = async () => {
        const {model} = this;
        await model.validateAsync().linkTo(this.validateButtonTask);
        if (model.isValid) {
            XH.toast({message: 'Form is valid'});
        } else {
            const errCount = model.fields.filter(f => f.isNotValid).length;
            XH.toast({
                icon: Icon.warning(),
                intent: 'danger',
                message: `Form is not valid. ${errCount} fields are still invalid!`
            });
        }
    }

    onResetClick = () => {
        this.model.resetFields();
    }
}
