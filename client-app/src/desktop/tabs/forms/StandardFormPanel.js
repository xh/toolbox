/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {box, hbox, panel, vbox, vframe, filler} from '@xh/hoist/cmp/layout';
import {toolbar} from '@xh/hoist/cmp/toolbar';
import {button} from '@xh/hoist/kit/blueprint';
import {textField, numberField, label, checkField, comboField} from '@xh/hoist/cmp/form';
import {wrapperPanel} from '../impl/WrapperPanel';
import {StandardFormPanelModel} from './StandardFormPanelModel';
import './StandardFormPanel.scss';

@HoistComponent()
export class StandardFormPanel extends Component {
    localModel = new StandardFormPanelModel();

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-standardform-panel',
                title: 'Standard Form',
                width: 335,
                item: this.renderExample(),
                bbar: toolbar(
                    filler(),
                    button({text: 'Submit', disabled: !this.model.isValid})
                )
            })
        );
    }

    renderExample() {
        return vframe({
            cls: 'xh-toolbox-example-container',
            flex: 1,
            padding: 10,
            items: [
                this.getLoginInfo(),
                this.getContactInfo()
            ]
        });
    }

    getLoginInfo() {
        const model = this.model;
        return panel({
            title: 'Credentials',
            flex: 0,
            item: vbox({
                cls: 'xh-panel-body',
                items: [
                    hbox(
                        label(this.renderLabel('User: ')),
                        textField({model, field: 'user', placeholder: 'User ID'})
                    ),
                    hbox(
                        label(this.renderLabel('Password: ')),
                        textField({model, field: 'password', placeholder: 'Password', type: 'password'})

                    ),
                    hbox(
                        label(this.renderLabel('Verify: ')),
                        textField({model, field: 'verify', placeholder: 'Password', type: 'password'})
                    )
                ]
            })
        });
    }

    getContactInfo() {
        const model = this.model,
            {red, green, blue, profileColor, options} = this.model;

        return panel({
            title: 'User Info',
            flex: 0,
            item: vbox({
                cls: 'xh-panel-body',
                items: [
                    hbox(
                        label(this.renderLabel('Profile Color: ')),
                        numberField({
                            model,
                            field: 'red',
                            width: 50,
                            value: red,
                            min: 0,
                            max: 255
                        }),
                        numberField({
                            model,
                            field: 'green',
                            width: 50,
                            value: green,
                            min: 0,
                            max: 255
                        }),
                        numberField({
                            model,
                            field: 'blue',
                            width: 50,
                            value: blue,
                            min: 0,
                            max: 255
                        }),
                        box({
                            style: {
                                backgroundColor: profileColor
                            },
                            width: 30,
                            height: 30
                        })
                    ),
                    hbox(
                        label(this.renderLabel('Age: ')),
                        numberField({model, field: 'age', width: 50, min: 0})
                    ),
                    hbox(
                        label(this.renderLabel('E-Mail: ')),
                        textField({model, field: 'email', placeholder: 'name@domain.com'})
                    ),
                    hbox(
                        label(this.renderLabel('Company: ')),
                        textField({model, field: 'company'})
                    ),
                    hbox(
                        label(this.renderLabel('State: ')),
                        comboField({
                            options,
                            model,
                            field: 'state',
                            placeholder: 'Select a State...'
                        }),
                    ),
                    hbox(
                        label(this.renderLabel('Active: ')),
                        checkField({model, field: 'active'})
                    )
                ]
            })
        });
    }

    renderLabel(text) {
        const isValid = this.model.isFieldValid(text),
            width = 90;
        const item = <span>{text}<span style={{color: 'red'}}>{!isValid ? '*' : ''}</span> </span>;

        return {item, width};
    }
}