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
import {mask} from '@xh/hoist/desktop/cmp/mask';
import {PendingTaskModel} from '@xh/hoist/utils/async';
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

    validateButtonTask = new PendingTaskModel();

    render() {
        const {model} = this,
            commitOnChange = model.commitOnChange,
            minimal = model.minimalValidation;

        return wrapper({
            item: panel({
                title: 'Validation',
                className: 'toolbox-validation-panel',
                icon: Icon.edit(),
                width: '90%',
                height: '90%',
                mask: mask({model: this.validateButtonTask}),
                item: hframe({
                    className: 'toolbox-validation-panel__content',
                    items: [
                        vbox({
                            width: 300,
                            marginRight: 30,
                            items: [
                                formField({
                                    model,
                                    field: 'firstName',
                                    minimal,
                                    item: textInput({commitOnChange})
                                }),
                                formField({
                                    model,
                                    field: 'lastName',
                                    minimal,
                                    item: textInput({commitOnChange})
                                }),
                                formField({
                                    model,
                                    field: 'email',
                                    minimal,
                                    item: textInput({
                                        placeholder: 'user@company.com',
                                        leftIcon: Icon.mail(),
                                        enableClear: true
                                    })
                                }),
                                formField({
                                    model,
                                    field: 'region',
                                    minimal,
                                    item: select({
                                        options: ['California', 'London', 'Montreal', 'New York']
                                    })
                                }),
                                formField({
                                    model,
                                    field: 'tags',
                                    minimal,
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
                                            model,
                                            field: 'startDate',
                                            minimal,
                                            item: dateInput({
                                                width: 120,
                                                commitOnChange
                                            })
                                        }),
                                        Icon.chevronRight({
                                            style: {margin: '0 4px'}
                                        }),
                                        formField({
                                            model,
                                            field: 'endDate',
                                            minimal,
                                            item: dateInput({
                                                width: 120,
                                                commitOnChange
                                            })
                                        })
                                    ]
                                }),
                                formField({
                                    model,
                                    field: 'yearsExperience',
                                    minimal,
                                    item: numberInput({width: 50, commitOnChange})
                                }),
                                formField({
                                    model,
                                    field: 'isManager',
                                    minimal,
                                    item: checkbox()
                                }),
                                formField({
                                    model,
                                    field: 'notes',
                                    minimal,
                                    item: textArea({width: 270, commitOnChange})
                                })
                            ]
                        })
                    ]
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
                    toolbarSep(),
                    switchInput({
                        model,
                        field: 'minimalValidation',
                        label: 'Minimal validation display'
                    }),
                    switchInput({
                        model,
                        field: 'commitOnChange',
                        label: 'Inputs commit on change'
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
