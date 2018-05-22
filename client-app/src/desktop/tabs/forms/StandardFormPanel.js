/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {hbox, panel, vbox, vframe, filler} from '@xh/hoist/cmp/layout';
import {toolbar} from '@xh/hoist/cmp/toolbar';
import {button} from '@xh/hoist/kit/blueprint';
import {textField, numberField, label, checkField, comboField} from '@xh/hoist/cmp/form';
import {wrapperPanel} from '../impl/WrapperPanel';
import {StandardFormPanelModel} from './StandardFormPanelModel';
import './StandardFormPanel.scss';

@HoistComponent()
export class StandardFormPanel extends Component {
    formModel = new StandardFormPanelModel();

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-standardform-panel',
                title: 'Standard Form',
                width: 335,
                item: this.renderExample(),
                bbar: toolbar(
                    filler(),
                    button({text: 'Submit'})
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
        return panel({
            title: 'Credentials',
            flex: 0,
            item: vbox({
                cls: 'xh-panel-body',
                items: [
                    hbox(
                        label('User: '),
                        textField({placeholder: 'User ID'})
                    ),
                    hbox(
                        label({flex: 1, item: 'Password: '}),
                        textField({placeholder: 'Password', type: 'password'})

                    ),
                    hbox(
                        label({flex: 1, item: 'Verify: '}),
                        textField({placeholder: 'Password', type: 'password'})
                    )
                ]
            })
        });
    }

    getContactInfo() {
        const model = this.formModel,
            {options} = model;

        return panel({
            title: 'User Info',
            flex: 0,
            item: vbox({
                cls: 'xh-panel-body',
                items: [
                    hbox(
                        label({item: 'First Name: ', width: 80}),
                        textField({placeholder: 'First Name'})
                    ),
                    hbox(
                        label({item: 'Last Name: ', width: 80}),
                        textField({placeholder: 'Last Name'})
                    ),
                    hbox(
                        label({item: 'Age: ', width: 80}),
                        numberField({width: 50})
                    ),
                    hbox(
                        label({item: 'E-Mail:', width: 80}),
                        textField({placeholder: 'name@domain.com'})
                    ),
                    hbox(
                        label({item: 'Company: ', width: 80}),
                        textField({placeholder: ''})
                    ),
                    hbox(
                        label({item: 'State: ', width: 80}),
                        comboField({
                            options,
                            model,
                            field: 'state',
                            placeholder: 'Select a State...'
                        }),
                    ),
                    hbox(
                        label({item: 'Active: ', width: 80}),
                        checkField(),
                    )
                ]
            })
        });
    }
}