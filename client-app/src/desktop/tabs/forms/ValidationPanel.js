/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {box, div, filler, hbox, hframe, hspacer, span, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formGroup} from '@xh/hoist/kit/blueprint';
import {mask} from '@xh/hoist/desktop/cmp/mask';
import {PendingTaskModel} from '@xh/hoist/utils/async';
import {checkField, dayField, numberField, textField} from '@xh/hoist/desktop/cmp/form';

import {wrapper} from '../../common';
import {ValidationPanelModel} from './ValidationPanelModel';

import './ValidationPanel.scss';

@HoistComponent()
export class ValidationPanel extends Component {

    localModel = new ValidationPanelModel();

    validateButtonTask = new PendingTaskModel();

    render() {
        const {model, fieldDisplay} = this;

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
                            items: [
                                fieldDisplay(
                                    textField({field: 'firstName', model})
                                ),
                                fieldDisplay(
                                    textField({field: 'lastName', model})
                                ),
                                fieldDisplay(
                                    textField({
                                        field: 'email',
                                        model,
                                        placeholder: 'user@company.com',
                                        leftIcon: Icon.mail(),
                                        rightElement: button({
                                            icon: Icon.cross(),
                                            minimal: true,
                                            onClick: () => model.setEmail(null)
                                        })
                                    })
                                ),
                                box('* indicates a required field')
                            ]
                        }),
                        hspacer(30),
                        vbox({
                            items: [
                                hbox(
                                    fieldDisplay(
                                        dayField({
                                            field: 'startDate',
                                            model,
                                            width: 200,
                                            commitOnChange: true,
                                            minDate: new Date()
                                        })
                                    ),
                                    hspacer(30),
                                    fieldDisplay(
                                        dayField({
                                            field: 'endDate',
                                            model,
                                            width: 200,
                                            commitOnChange: true,
                                            minDate: new Date()
                                        })
                                    )
                                ),
                                hbox(
                                    fieldDisplay(
                                        checkField({
                                            field: 'isManager',
                                            model,
                                            width: 200
                                        })
                                    ),
                                    hspacer(30),
                                    fieldDisplay(
                                        numberField({
                                            field: 'yearsExperience',
                                            model,
                                            width: 50
                                        })
                                    )
                                )
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

    fieldDisplay = (ctl) => {
        const {model} = this,
            fieldName = ctl.props.field,
            field = model.getField(fieldName),
            notValid = field && field.isNotValid,
            isRequired = field && field.isRequired,
            isPending = field && field.isValidationPending;

        const label = isRequired ?
            div(field.displayName, span(' *')) :
            div(field.displayName);

        return formGroup({
            label,
            item: ctl,
            helperText: hbox({
                height: 15,
                items: [
                    span({
                        style: {color: 'red'},
                        item: notValid ? field.errors[0] : ''
                    }),
                    hspacer(5),
                    span({
                        omit: !isPending,
                        item: 'Checking ...'
                    })
                ]
            })
        });
    };

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
