import {chip} from '@xh/hoist/cmp/chip';
import type {FieldModel} from '@xh/hoist/cmp/form';
import {form, FormModel} from '@xh/hoist/cmp/form';
import type {HoistProps} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {numberIs, required} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import type {FormFieldProps} from '@xh/hoist/desktop/cmp/form';
import {defaultReadonlyRenderer, formField} from '@xh/hoist/desktop/cmp/form';
import {numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {bindable} from '@xh/hoist/mobx';
import {isEqual} from 'lodash';
import type {ReactElement, ReactNode} from 'react';
import {demoFrame, demoGrid, demoPanel, demoSection} from '../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../common/Wrapper';

interface Binding {
    $var: string;
}

const DEFAULTS = {title: 'Holdings', pageSize: 50, currency: 'USD', showTotals: true},
    VARIABLES = ['reportCcy', 'baseCcy', 'clientCcy'],
    isBinding = (v: unknown): v is Binding => !!(v as Binding)?.$var;

export const formFieldItemsPanel = hoistCmp.factory({
    displayName: 'FormFieldItemsPanel',
    model: creates(() => FormFieldItemsPanelModel),

    render({model}) {
        return wrapper({
            title: 'Field Items',
            icon: Icon.edit(),
            description: [
                '`rightItems` puts per-field buttons or menus beside an input, such as a reset.',
                'Inline, they follow the input in its row, and `rightItemsWidth` keeps every',
                "input ending at one edge. Stacked, they sit at the right end of the label's row.",
                '',
                '`inputRenderer` wraps or replaces the bound input. Here a currency bound to a',
                'variable shows as a chip. Both can be set once, in `fieldDefaults`.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/FormFieldItemsPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/form/README.md', text: 'Form docs'},
                {url: '$HR/desktop/cmp/form/FormField.ts', notes: 'Hoist component.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Both forms',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    children: [
                        wrapperOption({
                            label: 'Readonly',
                            info: 'rightItems show only while a field is editable.',
                            control: switchInput({bind: 'readonly'})
                        }),
                        wrapperOption({
                            label: 'Disabled',
                            info: 'Items read field.disabled themselves.',
                            control: switchInput({bind: 'disabled'})
                        })
                    ]
                })
            ],
            children: demoPanel({
                children: demoSection({
                    title: 'Widget settings',
                    children: demoGrid({
                        columns: 2,
                        children: [
                            demoFrame({
                                label: 'Inline',
                                info: 'inline, labelWidth: 96, rightItemsWidth: 52',
                                children: settingsForm({
                                    model: model.inlineForm,
                                    fieldDefaults: {
                                        ...SETTINGS_DEFAULTS,
                                        inline: true,
                                        labelWidth: 96,
                                        rightItemsWidth: 52
                                    }
                                })
                            }),
                            demoFrame({
                                label: 'Stacked',
                                info: "Items on the label's row - the input keeps its full width",
                                children: settingsForm({
                                    model: model.stackedForm,
                                    fieldDefaults: SETTINGS_DEFAULTS
                                })
                            })
                        ]
                    })
                })
            })
        });
    }
});

const settingsForm = hoistCmp.factory<
    HoistProps<FormModel> & {fieldDefaults: Partial<FormFieldProps>}
>({
    displayName: 'SettingsForm',
    render({model, fieldDefaults}) {
        return form({
            model,
            fieldDefaults,
            children: [
                formField({field: 'title', children: textInput()}),
                formField({field: 'pageSize', children: numberInput()}),
                formField({
                    field: 'currency',
                    children: select({options: ['USD', 'EUR', 'GBP', 'JPY']})
                }),
                formField({field: 'showTotals', children: switchInput()})
            ]
        });
    }
});

// Module-level functions keep fieldDefaults stable, so the form doesn't re-render every field.
const SETTINGS_DEFAULTS: Partial<FormFieldProps> = {
    rightItems: settingItems,
    inputRenderer: bindingAware,
    readonlyRenderer: bindingAwareReadonly
};

function settingItems(field: FieldModel): ReactNode[] {
    return [field.name === 'currency' ? bindMenu({field}) : null, resetButton({field})];
}

function bindingAware(input: ReactElement, field: FieldModel): ReactNode {
    const {value} = field;
    if (!isBinding(value)) return input;
    return chip({
        ref: field.boundInputRef,
        icon: Icon.link(),
        intent: 'primary',
        minimal: true,
        disabled: field.disabled,
        onRemove: () => field.setValue(DEFAULTS[field.name]),
        children: value.$var
    });
}

function bindingAwareReadonly(value: unknown, field: FieldModel): ReactNode {
    return isBinding(value)
        ? chip({icon: Icon.link(), intent: 'primary', minimal: true, children: value.$var})
        : defaultReadonlyRenderer(value);
}

const bindMenu = hoistCmp.factory<HoistProps & {field: FieldModel}>({
    displayName: 'BindMenu',
    model: false,
    render({field}) {
        const bound = isBinding(field.value);
        return popover({
            disabled: field.disabled,
            content: menu({
                children: VARIABLES.map(v =>
                    menuItem({
                        key: v,
                        text: v,
                        icon: Icon.link(),
                        onClick: () => field.setValue({$var: v})
                    })
                )
            }),
            children: button({
                icon: Icon.link(),
                intent: bound ? 'primary' : null,
                minimal: true,
                disabled: field.disabled,
                tooltip: bound ? 'Change binding' : 'Bind to a variable'
            })
        });
    }
});

// An observer, so it shows as the value moves off its default and hides when it returns.
const resetButton = hoistCmp.factory<HoistProps & {field: FieldModel}>({
    displayName: 'ResetToDefault',
    model: false,
    render({field}) {
        const defaultValue = DEFAULTS[field.name];
        return button({
            icon: Icon.reset(),
            minimal: true,
            tooltip: `Reset to default (${defaultValue})`,
            omit: isEqual(field.value, defaultValue),
            disabled: field.disabled,
            onClick: () => field.setValue(defaultValue)
        });
    }
});

class FormFieldItemsPanelModel extends HoistModel {
    @bindable accessor readonly = false;
    @bindable accessor disabled = false;

    @managed inlineForm = createSettingsForm();
    @managed stackedForm = createSettingsForm();

    constructor() {
        super();
        this.addReaction({
            track: () => [this.readonly, this.disabled],
            run: ([readonly, disabled]) => {
                [this.inlineForm, this.stackedForm].forEach(it => {
                    it.readonly = readonly;
                    it.disabled = disabled;
                });
            }
        });
    }
}

function createSettingsForm(): FormModel {
    return new FormModel({
        fields: [
            {name: 'title', initialValue: 'Top holdings', rules: [required]},
            {name: 'pageSize', initialValue: 100, rules: [numberIs({max: 500})]},
            {name: 'currency', initialValue: {$var: 'reportCcy'}},
            {name: 'showTotals', initialValue: true}
        ]
    });
}
