/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {XH, HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {vbox, hbox, filler, div, span, hspacer} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formGroup} from '@xh/hoist/kit/blueprint';
import {
    dayField,
    textField,
    numberField
} from '@xh/hoist/desktop/cmp/form';

import {wrapper} from '../../common';
import {ValidationPanelModel} from './ValidationPanelModel';

import './ValidationPanel.scss';

@HoistComponent()
export class ValidationPanel extends Component {

    localModel = new ValidationPanelModel();

    render() {
        const {model, row} = this;

        return wrapper({
            item: panel({
                title: 'Validation',
                className: 'toolbox-validation-panel',
                icon: Icon.edit(),
                width: '90%',
                height: '90%',
                item: panel({
                    className: 'toolbox-validation-panel__panel',
                    items: vbox(
                        row(
                            textField({field: 'firstName', model})
                        ),
                        row(
                            textField({field: 'lastName', model})
                        ),
                        row(
                            textField({
                                field: 'email',
                                model,
                                placeholder: 'user@company.com',
                                leftIcon: Icon.mail(),
                                rightElement: button({
                                    icon: Icon.cross(),
                                    minimal: true,
                                    onClick: () => model.setText2(null)
                                })
                            })
                        ),
                        row(
                            numberField({
                                field: 'yearsExperience',
                                model
                            })
                        ),
                        row(
                            dayField({
                                field: 'startDate',
                                model,
                                commitOnChange: true,
                                minDate: new Date()
                            })
                        ),
                        row(
                            dayField({
                                field: 'endDate',
                                model,
                                commitOnChange: true,
                                minDate: new Date()
                            })
                        ),
                        hbox(
                            button({
                                text: 'Reset',
                                onClick: this.onResetClick
                            }),
                            button({
                                text: 'Validate',
                                onClick: this.onValidateClick,
                            }),
                            button({
                                text: 'Add User', 
                                onClick: this.onSubmitClick,
                                disabled: !model.isValid
                            }),
                            filler()
                        )

                    )
                })
            })
        });
    }

    row = (ctl) => {
        const {model} = this,
            fieldName = ctl.props.field,
            field = model.getField(fieldName),
            notValid = field && field.isNotValid,
            isRequired = field && field.isRequired,
            isPending = field && field.isValidationPending;

        const label = field.isRequired ?
            div(field.displayName, span(' (*)')) :
            div(field.displayName)

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
        XH.toast({message: 'User Successfully submitted'});
        this.model.resetFields();
    }

    onResetClick = () => {
        this.model.resetFields();
    }

    onValidateClick = () => {
        this.model.validateAsync();
    }
}
