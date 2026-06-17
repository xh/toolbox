import {form, formFieldSet} from '@xh/hoist/cmp/form';
import {div, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {fmtPercent} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import {formField} from '@xh/hoist/mobile/cmp/form';
import {
    buttonGroupInput,
    checkbox,
    checkboxButton,
    dateInput,
    label,
    numberInput,
    select,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {exampleAction, exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './FormPage.scss';
import {FormPageModel} from './FormPageModel';

export const formPage = hoistCmp.factory({
    model: creates(FormPageModel),

    render({model}) {
        return exampleScreen({
            title: 'Forms',
            icon: Icon.edit(),
            description: [
                "Hoist's `FormModel` binds inputs to observable state with built-in validation. This",
                'example shows the common input types in a single form, with display options moved',
                'into this sheet so they apply live to the fields behind it.'
            ],
            options: [
                exampleOption({
                    label: 'Read-only',
                    control: switchInput({model: model.formModel, bind: 'readonly'})
                }),
                exampleOption({
                    label: 'Minimal validation',
                    control: switchInput({model, bind: 'minimal'})
                }),
                exampleOption({
                    label: 'Commit on change',
                    control: switchInput({model, bind: 'commitOnChange'})
                }),
                exampleOption({
                    label: 'Required markers',
                    control: switchInput({model, bind: 'requiredMarkers'})
                }),
                exampleOption({
                    label: 'Density',
                    control: buttonGroupInput({
                        model,
                        bind: 'density',
                        items: [
                            button({value: 'comfortable', text: 'Comfortable'}),
                            button({value: 'compact', text: 'Compact'})
                        ]
                    })
                }),
                exampleAction({
                    text: 'Reset form',
                    icon: Icon.reset(),
                    onClick: () => model.formModel.reset()
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/form/FormPage.ts', notes: 'This example.'},
                {
                    url: '$HR/cmp/form/README.md',
                    text: 'Forms docs',
                    notes: 'FormModel, validation & binding'
                }
            ],
            item: formDemo()
        });
    }
});

const formDemo = hoistCmp.factory<FormPageModel>(({model}) => {
    const {minimal, commitOnChange, requiredMarkers, density, movies} = model;
    return panel({
        scrollable: true,
        className: `tb-form-page tb-form-page--${density}`,
        item: form({
            fieldDefaults: {
                minimal,
                commitOnChange,
                requiredIndicator: requiredMarkers ? '*' : ''
            },
            items: vbox(
                formFieldSet({
                    title: 'Field Set 1',
                    modelConfig: {collapsible: true},
                    items: [
                        formField({
                            field: 'name',
                            info: 'Min. 8 chars',
                            item: textInput({enableClear: true})
                        }),
                        formField({
                            field: 'customer',
                            item: select({
                                placeholder: 'Search customers...',
                                title: 'Search customers...',
                                enableFilter: true,
                                enableFullscreen: true,
                                queryFn: q => model.queryCustomersAsync(q)
                            })
                        }),
                        formField({
                            field: 'movie',
                            item: select({placeholder: 'Select a Movie...', options: movies})
                        })
                    ]
                }),
                formFieldSet({
                    className: 'xh-margin-top',
                    title: 'Field Set 2',
                    modelConfig: {collapsible: true},
                    items: [
                        formField({
                            field: 'salary',
                            item: numberInput({
                                enableShorthandUnits: false,
                                displayWithCommas: true
                            })
                        }),
                        formField({
                            field: 'percentage',
                            item: numberInput({scaleFactor: 100, valueLabel: '%'})
                        }),
                        formField({
                            field: 'date',
                            item: dateInput({
                                minDate: LocalDate.today().subtract(2),
                                maxDate: LocalDate.today().add(1, 'month'),
                                textAlign: 'right',
                                valueType: 'localDate'
                            })
                        }),
                        booleanInputs(),
                        formField({
                            field: 'buttonGroup',
                            item: buttonGroupInput(
                                button({text: 'List', value: 'button1'}),
                                button({text: 'Grid', value: 'button2'}),
                                button({text: 'Chart', value: 'button3'})
                            )
                        }),
                        formField({field: 'notes', item: textArea()})
                    ]
                }),
                results()
            )
        })
    });
});

// The teaching point of the example: one field ('enabled'), bound to three different Hoist controls.
// Captioned so each control reads as a distinct variant (mobile has no radio input - the third is the
// button-style checkbox).
const booleanInputs = hoistCmp.factory(() => {
    return div({
        className: 'tb-form-page__booleans',
        items: [
            div({className: 'tb-form-page__booleans-title', item: 'Boolean inputs'}),
            div({
                className: 'tb-form-page__booleans-sub',
                item: 'One field, three Hoist controls.'
            }),
            formField({field: 'enabled', label: 'Checkbox', item: checkbox()}),
            formField({field: 'enabled', label: 'Switch', item: switchInput()}),
            formField({field: 'enabled', label: 'Button', item: checkboxButton()})
        ]
    });
});

const results = hoistCmp.factory(() => {
    return div({
        className: 'tb-card',
        items: [
            fieldResult({field: 'name'}),
            fieldResult({field: 'customer'}),
            fieldResult({field: 'movie'}),
            fieldResult({field: 'salary'}),
            fieldResult({field: 'percentage', renderer: v => fmtPercent(v, {nullDisplay: '-'})}),
            fieldResult({field: 'date', renderer: v => v?.toString()}),
            fieldResult({field: 'enabled', renderer: v => (v ? 'Yes' : 'No')}),
            fieldResult({field: 'buttonGroup'}),
            fieldResult({field: 'notes'})
        ]
    });
});

const fieldResult = hoistCmp.factory<FormPageModel>(({model, field, renderer}) => {
    const {displayName, value} = model.formModel.fields[field],
        renderedVal = renderer ? renderer(value) : value;

    return div({
        className: 'tb-form-page__result',
        items: [label(displayName), div(renderedVal ?? '-')]
    });
});
