/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {vbox, hbox, filler, span} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import moment from 'moment';
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
                                onClick: this.onResetClick,
                            }),
                            button({
                                text: 'Add User', 
                                onClick: this.onSubmitClick,
                                disabled: !model.validationModel.isValid
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
            field = ctl.props.field,
            fieldName = model.getFieldName(field),
            validator = model.getValidator(field),
            notValid = validator && validator.isNotValid;

        return formGroup({
            label: fieldName,
            item: ctl,
            helperText:
                span({
                    className: 'toolbox-validation-panel__panel',
                    items: notValid ? validator.errors[0] : ''
                })
        });
    };

    onSubmitClick = () => {
        XH.toast({message: 'User Successfully submitted'});
        this.model.reset();
    }

    onCancelClick = () => {
        this.model.reset();
    }
}
