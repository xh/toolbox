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
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {mask} from '@xh/hoist/desktop/cmp/mask';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {formField, checkBox, dateInput, numberInput, textInput} from '@xh/hoist/desktop/cmp/form';

import {wrapper} from '../../common';
import {ValidationPanelModel} from './ValidationPanelModel';

import './ValidationPanel.scss';

@HoistComponent
export class ValidationPanel extends Component {

    localModel = new ValidationPanelModel();

    validateButtonTask = new PendingTaskModel();

    render() {
        const {model} = this;

        return wrapper({
            item: panel({
                title: 'Validation',
                className: 'toolbox-validation-panel',
                icon: Icon.edit(),
                width: '90%',
                height: '90%',
                mask: mask({model: this.validateButtonTask}),
                item: panel({
                    className: 'toolbox-validation-panel__panel',
                    item: hframe(
                        vbox({
                            width: 300,
                            marginRight: 30,
                            items: [
                                formField({
                                    model,
                                    field: 'firstName',
                                    item: textInput()
                                }),
                                formField({
                                    model,
                                    field: 'lastName',
                                    item: textInput()
                                }),
                                formField({
                                    model,
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
                                })
                            ]
                        }),
                        vbox({
                            items: [
                                hbox({
                                    alignItems: 'center',
                                    items: [
                                        formField({
                                            model,
                                            field: 'startDate',
                                            item: dateInput({
                                                width: 120,
                                                commitOnChange: true,
                                                minDate: new Date()
                                            })
                                        }),
                                        Icon.chevronRight({
                                            style: {margin: '0 4px'}
                                        }),
                                        formField({
                                            model,
                                            field: 'endDate',
                                            item: dateInput({
                                                width: 120,
                                                commitOnChange: true,
                                                minDate: new Date()
                                            })
                                        })
                                    ]
                                }),
                                formField({
                                    model,
                                    field: 'yearsExperience',
                                    item: numberInput({width: 50})
                                }),
                                formField({
                                    model,
                                    label: 'Employment Role',
                                    field: 'isManager',
                                    item: checkBox({
                                        width: 200,
                                        label: 'manager'
                                    })
                                })
                            ]
                        })
                    )
                }),
                bbar: toolbar(
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
                    filler(),
                    button({
                        text: 'Submit',
                        icon: Icon.add(),
                        intent: 'success',
                        onClick: this.onSubmitClick,
                        disabled: !model.isValid
                    })
                )
            })
        });
    }

    onSubmitClick = () => {
        if (this.model.isValid) {
            XH.toast({message: 'User successfully submitted.'});
        }
        this.model.resetFields();
    }

    onResetClick = () => {
        this.model.resetFields();
    }

    onValidateClick = async () => {
        const {model} = this;
        await model.validateAsync().linkTo(this.validateButtonTask);

        if (this.model.isValid) {
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
}
