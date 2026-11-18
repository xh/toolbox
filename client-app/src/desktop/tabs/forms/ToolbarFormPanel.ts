import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, span, vbox} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {
    buttonGroupInput,
    checkbox,
    checkboxButton,
    dateInput,
    numberInput,
    picker,
    radioInput,
    segmentedControl,
    select,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {usStates} from '../../../core/data/USStates';
import {wrapper, wrapperOption} from '../../common/Wrapper';
import {ToolbarFormPanelModel} from './ToolbarFormPanelModel';
import './ToolbarFormPanel.scss';

export const toolbarFormPanel = hoistCmp.factory({
    model: creates(ToolbarFormPanelModel),

    render({model}) {
        const {topFormModel, bottomFormModel} = model;

        return wrapper({
            title: 'Forms in Toolbars',
            icon: Icon.edit(),
            description: [
                'Forms and `FormField`s can also be used inside Toolbars.',
                '',
                'When using a `FormField` within a Toolbar, it is not necessary to set the',
                '`inline` prop. `FormField`s within Toolbars are always displayed as if',
                '`inline: true`. For validation, it is recommended to set `minimal: true` on',
                'your `FormField`s or via `Form.fieldDefaults`. When not using minimal',
                'validation, validation messages will be shown to the right of the',
                '`FormField`.',
                '',
                'Using `TextArea`, `JSONInput` or `Slider` inputs within Toolbars is not',
                'currently supported, and may lead to unwanted sizing side effects.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/ToolbarFormPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/form/README.md#formmodel',
                    text: 'Form docs',
                    notes: 'Form infrastructure guide and validation concepts.'
                },
                {url: '$HR/cmp/form/Form.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/desktop/cmp/form/FormField.ts',
                    notes: 'Renders inline automatically when placed within a Toolbar.'
                },
                {url: '$HR/desktop/cmp/toolbar/Toolbar.ts', notes: 'Hoist component.'}
            ],
            options: wrapperOption({
                label: 'Compact toolbars',
                propName: 'ToolbarProps.compact',
                info: 'Toolbars and the FormFields inside them shrink together.',
                control: switchInput({model, bind: 'compact'})
            }),
            children: vbox({
                className: 'tb-toolbar-form',
                children: [
                    form({
                        model: topFormModel,
                        fieldDefaults: {minimal: true, label: null},
                        children: toolbar({
                            compact: model.compact,
                            children: [
                                groupLabel('Text, Number & Date'),
                                '-',
                                formField({
                                    field: 'text1',
                                    flex: 1,
                                    commitOnChange: true,
                                    children: textInput({placeholder: 'Enter text...'})
                                }),
                                formField({
                                    field: 'number1',
                                    width: 120,
                                    children: numberInput({
                                        enableShorthandUnits: true,
                                        displayWithCommas: true,
                                        selectOnFocus: true
                                    })
                                }),
                                formField({
                                    field: 'date1',
                                    width: 140,
                                    children: dateInput({
                                        valueType: 'localDate',
                                        placeholder: 'YYYY-MM-DD',
                                        enableClear: true
                                    })
                                })
                            ]
                        })
                    }),
                    form({
                        model: topFormModel,
                        fieldDefaults: {minimal: true, label: null},
                        children: toolbar({
                            compact: model.compact,
                            children: [
                                groupLabel('Buttons & Toggles'),
                                '-',
                                formField({
                                    field: 'buttonGroup1',
                                    children: buttonGroupInput(
                                        button({
                                            icon: Icon.gear(),
                                            text: 'Option 1',
                                            value: 'button1'
                                        }),
                                        button({
                                            icon: Icon.skull(),
                                            text: 'Option 2',
                                            value: 'button2'
                                        })
                                    )
                                }),
                                formField({
                                    field: 'buttonGroup1',
                                    children: segmentedControl({
                                        compact: model.compact,
                                        options: [
                                            {
                                                value: 'button1',
                                                label: 'Option 1',
                                                icon: Icon.gear()
                                            },
                                            {
                                                value: 'button2',
                                                label: 'Option 2',
                                                icon: Icon.skull()
                                            }
                                        ]
                                    })
                                }),
                                '-',
                                formField({field: 'bool1', children: checkbox({label: 'enabled'})}),
                                formField({
                                    field: 'bool1',
                                    children: switchInput({label: 'enabled'})
                                }),
                                formField({
                                    field: 'bool1',
                                    children: checkboxButton({text: 'Active'})
                                })
                            ]
                        })
                    }),
                    form({
                        model: bottomFormModel,
                        fieldDefaults: {minimal: true, label: null},
                        children: toolbar({
                            compact: model.compact,
                            children: [
                                groupLabel('Selection'),
                                '-',
                                formField({
                                    field: 'option1',
                                    width: 150,
                                    children: select({
                                        options: usStates,
                                        enableFilter: false,
                                        placeholder: 'Select a state...'
                                    })
                                }),
                                formField({
                                    field: 'option2',
                                    flex: 1,
                                    children: select({
                                        options: usStates,
                                        enableClear: false,
                                        enableMulti: true,
                                        placeholder: 'Select state(s)...'
                                    })
                                }),
                                formField({
                                    field: 'option2',
                                    children: picker({
                                        compact: model.compact,
                                        options: usStates,
                                        enableMulti: true,
                                        enableClear: true,
                                        displayNoun: 'state',
                                        buttonProps: {icon: Icon.globe()},
                                        width: 180
                                    })
                                })
                            ]
                        })
                    }),
                    form({
                        model: bottomFormModel,
                        fieldDefaults: {minimal: true, label: null},
                        children: toolbar({
                            compact: model.compact,
                            children: [
                                groupLabel('Side'),
                                '-',
                                formField({
                                    field: 'option3',
                                    children: radioInput({
                                        inline: true,
                                        options: [
                                            'Buy',
                                            'Sell',
                                            {label: 'Short', value: 'Short', disabled: true}
                                        ]
                                    })
                                })
                            ]
                        })
                    }),
                    toolbar({
                        compact: model.compact,
                        children: [
                            filler(),
                            button({
                                text: 'Reset',
                                icon: Icon.undo(),
                                onClick: () => {
                                    topFormModel.reset();
                                    bottomFormModel.reset();
                                },
                                disabled: !topFormModel.isDirty && !bottomFormModel.isDirty
                            }),
                            button({
                                text: 'Validate',
                                icon: Icon.check(),
                                intent: 'success',
                                onClick: () => {
                                    topFormModel.validateAsync();
                                    bottomFormModel.validateAsync();
                                }
                            })
                        ]
                    })
                ]
            })
        });
    }
});

const groupLabel = (text: string) => span(text);
