/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {box, hbox, panel, vbox, hframe, filler} from '@xh/hoist/cmp/layout';
import {toolbar} from '@xh/hoist/cmp/toolbar';
import {button} from '@xh/hoist/kit/blueprint';
import {checkField, comboField, label, numberField, selectField, textField} from '@xh/hoist/cmp/form';
import {wrapperPanel} from '../impl/WrapperPanel';
import {FormFieldsPanelModel} from './FormFieldsPanelModel';
import './FormFieldsPanel.scss';

@HoistComponent()
export class FormFieldsPanel extends Component {
    localModel = new FormFieldsPanelModel();

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-formfields-panel',
                title: 'Form Fields',
                width: 600,
                item: this.renderExample(),
                bbar: toolbar(
                    filler(),
                    button({text: 'Submit', disabled: !this.model.isValid})
                )
            })
        );
    }

    renderExample() {
        return hframe({
            cls: 'xh-toolbox-example-container',
            items: [
                vbox({
                    flex: 2,
                    marginRight: 5,
                    items: [
                        this.getLoginInfo(),
                        this.getContactInfo()
                    ]
                }),
                this.getRawValueInfo()
            ]
        });
    }

    getLoginInfo() {
        const model = this.model;
        return panel({
            title: 'Credentials',
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
            {red, green, blue, movies, profileColor, usStates} = this.model;

        return panel({
            title: 'User Info',
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
                            max: 255,
                            commitOnChange: true
                        }),
                        numberField({
                            model,
                            field: 'green',
                            width: 50,
                            value: green,
                            min: 0,
                            max: 255,
                            commitOnChange: true
                        }),
                        numberField({
                            model,
                            field: 'blue',
                            width: 50,
                            value: blue,
                            min: 0,
                            max: 255,
                            commitOnChange: true
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
                        selectField({
                            options: usStates,
                            model,
                            field: 'state',
                            placeholder: 'Select a State...'
                        }),
                    ),
                    hbox(
                        label(this.renderLabel('Favorite Movie: ')),
                        comboField({
                            options: movies,
                            model,
                            field: 'movie',
                            placeholder: 'Search...'
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

    getRawValueInfo() {
        const {active, age, company, email, getDisplayValue, movie, password, state, user, verify, red, green, blue} = this.model;
        return panel({
            title: 'Current Values',
            width: 270,
            cls: 'rawvalues',
            item: vbox({
                cls: 'xh-panel-body',
                items: [
                    hbox(
                        label('User:'),
                        label(getDisplayValue(user)),
                    ),
                    hbox(
                        label('Password:'),
                        label(getDisplayValue(password)),
                    ),
                    hbox(
                        label('Verify:'),
                        label(getDisplayValue(verify)),
                    ),
                    hbox(
                        label('Profile Color:'),
                        label(`rgb(${getDisplayValue(red)}, ${getDisplayValue(green)}, ${getDisplayValue(blue)})`),
                    ),
                    hbox(
                        label('Age:'),
                        label(`${getDisplayValue(age)}`),
                    ),
                    hbox(
                        label('E-Mail:'),
                        label(getDisplayValue(email)),
                    ),
                    hbox(
                        label('Company:'),
                        label(getDisplayValue(company)),
                    ),
                    hbox(
                        label('State:'),
                        label(getDisplayValue(state)),
                    ),
                    hbox(
                        label('Favorite Movie:'),
                        label(getDisplayValue(movie)),
                    ),
                    hbox(
                        label('Active:'),
                        label(getDisplayValue(active)),
                    )
                ]
            })
        });
    }


    renderLabel(text) {
        const isValid = this.model.isFieldValid(text),
            width = 110;
        const item = <span>{text}<span style={{color: 'red'}}>{!isValid ? '*' : ''}</span> </span>;

        return {item, width};
    }
}