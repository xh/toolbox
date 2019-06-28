/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {frame, filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    checkbox,
    dateInput,
    textInput,
    numberInput,
    radioInput,
    select,
    switchInput,
    buttonGroupInput
} from '@xh/hoist/desktop/cmp/input';

import {usStates} from '../../../core/data';
import {wrapper} from '../../common';
import {ToolbarFormPanelModel} from './ToolbarFormPanelModel';

@HoistComponent
export class ToolbarFormPanel extends Component {

    model = new ToolbarFormPanelModel();

    render() {
        const {topFormModel, bottomFormModel} = this.model;

        return wrapper({
            description: [
                <p>
                    Forms and FormFields can also be used inside Toolbars.
                </p>,
                <p>
                    When using a FormField within a Toolbar, it is not necessary to set the <code>inline</code> prop - FormFields within Toolbars are always displayed as if <code>inline: true</code>.
                    For validation, it is recommenced to set <code>minimal: true</code> on your FormFields or via Form.fieldDefaults. When not using minimal validation, validation messages will be shown to the right of the FormField.
                </p>,
                <p>
                    Using TextArea, JSONInput or Slider inputs within Toolbars is not currently supported, and may lead to unwanted sizing side-effects.
                </p>
            ],
            item: panel({
                title: 'Forms › Toolbar Form',
                className: 'toolbox-toolbar-form-panel',
                icon: Icon.edit(),
                width: '90%',
                height: 300,
                tbar: toolbar(
                    form({
                        model: topFormModel,
                        fieldDefaults: {minimal: true},
                        items: [
                            formField({
                                label: 'Inline label:',
                                field: 'text1',
                                commitOnChange: true,
                                minimal: false,
                                item: textInput()
                            }),
                            formField({
                                label: null,
                                field: 'number1',
                                item: numberInput({
                                    enableShorthandUnits: true,
                                    displayWithCommas: true,
                                    selectOnFocus: true
                                })
                            }),
                            formField({
                                label: null,
                                field: 'date1',
                                width: 150,
                                item: dateInput({
                                    placeholder: 'YYYY-MM-DD',
                                    enableClear: true
                                })
                            }),
                            formField({
                                label: null,
                                field: 'buttonGroup1',
                                item: buttonGroupInput(
                                    button({
                                        icon: Icon.gear(),
                                        text: 'Button 1',
                                        value: 'button1'
                                    }),
                                    button({
                                        icon: Icon.skull(),
                                        text: 'Button 2',
                                        value: 'button2'
                                    })
                                )
                            }),
                            formField({
                                label: null,
                                field: 'bool1',
                                item: checkbox({label: 'enabled'})
                            }),
                            formField({
                                label: null,
                                field: 'bool2',
                                item: switchInput({label: 'enabled'})
                            }),
                            filler(),
                            button({
                                text: 'Reset',
                                icon: Icon.undo(),
                                onClick: () => topFormModel.reset(),
                                disabled: !topFormModel.isDirty
                            }),
                            button({
                                text: 'Validate',
                                icon: Icon.check(),
                                intent: 'success',
                                onClick: () => topFormModel.validateAsync()
                            })
                        ]
                    })
                ),
                bbar: toolbar(
                    form({
                        model: bottomFormModel,
                        fieldDefaults: {minimal: true},
                        items: [
                            formField({
                                label: 'Multi-select:',
                                field: 'option2',
                                width: 400,
                                item: select({
                                    options: usStates,
                                    enableClear: false,
                                    enableMulti: true,
                                    placeholder: 'Select state(s)...'
                                })
                            }),
                            formField({
                                label: null,
                                field: 'option1',
                                width: 150,
                                item: select({
                                    options: usStates,
                                    enableFilter: false,
                                    placeholder: 'Select a state...'
                                })
                            }),
                            formField({
                                label: null,
                                field: 'option3',
                                item: radioInput({
                                    options: ['Steak', 'Chicken', {label: 'Fish', value: 'Fish', disabled: true}]
                                })
                            }),
                            filler(),
                            button({
                                text: 'Reset',
                                icon: Icon.undo(),
                                onClick: () => bottomFormModel.reset(),
                                disabled: !bottomFormModel.isDirty
                            })
                        ]
                    })
                ),
                item: frame({
                    padding: 10,
                    item: 'Help, I am surrounded by toolbars!'
                })
            })
        });
    }
}