import React from 'react';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, frame} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {
    buttonGroupInput,
    checkbox,
    dateInput,
    numberInput,
    radioInput,
    select,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';

import {usStates} from '../../../core/data';
import {wrapper} from '../../common';
import {ToolbarFormPanelModel} from './ToolbarFormPanelModel';

export const toolbarFormPanel = hoistCmp.factory({
    model: creates(ToolbarFormPanelModel),

    render({model}) {
        const {topFormModel, bottomFormModel} = model;

        return wrapper({
            description: [
                <p>Forms and FormFields can also be used inside Toolbars.</p>,
                <p>
                    When using a FormField within a Toolbar, it is not necessary to set the{' '}
                    <code>inline</code> prop - FormFields within Toolbars are always displayed as if{' '}
                    <code>inline: true</code>. For validation, it is recommenced to set{' '}
                    <code>minimal: true</code> on your FormFields or via Form.fieldDefaults. When
                    not using minimal validation, validation messages will be shown to the right of
                    the FormField.
                </p>,
                <p>
                    Using TextArea, JSONInput or Slider inputs within Toolbars is not currently
                    supported, and may lead to unwanted sizing side-effects.
                </p>
            ],
            item: panel({
                title: 'Forms › Toolbar Form',
                className: 'tb-toolbar-form-panel',
                icon: Icon.edit(),
                width: '90%',
                height: 300,
                tbar: form({
                    model: topFormModel,
                    fieldDefaults: {minimal: true, label: null},
                    item: toolbar(
                        formField({
                            label: 'Inline label:',
                            field: 'text1',
                            commitOnChange: true,
                            item: textInput()
                        }),
                        formField({
                            field: 'number1',
                            item: numberInput({
                                enableShorthandUnits: true,
                                displayWithCommas: true,
                                selectOnFocus: true
                            })
                        }),
                        formField({
                            field: 'date1',
                            width: 140,
                            item: dateInput({
                                valueType: 'localDate',
                                placeholder: 'YYYY-MM-DD',
                                enableClear: true
                            })
                        }),
                        formField({
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
                            field: 'bool1',
                            item: checkbox({label: 'enabled'})
                        }),
                        formField({
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
                    )
                }),
                bbar: form({
                    model: bottomFormModel,
                    fieldDefaults: {minimal: true, label: null},
                    item: toolbar(
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
                            field: 'option1',
                            width: 150,
                            item: select({
                                options: usStates,
                                enableFilter: false,
                                placeholder: 'Select a state...'
                            })
                        }),
                        toolbarSep(),
                        formField({
                            field: 'option3',
                            item: radioInput({
                                options: [
                                    'Steak',
                                    'Chicken',
                                    {label: 'Fish', value: 'Fish', disabled: true}
                                ]
                            })
                        }),
                        filler(),
                        button({
                            text: 'Reset',
                            icon: Icon.undo(),
                            onClick: () => bottomFormModel.reset(),
                            disabled: !bottomFormModel.isDirty
                        })
                    )
                }),
                item: frame({
                    padding: 10,
                    item: 'Help, I am surrounded by toolbars!'
                })
            })
        });
    }
});
