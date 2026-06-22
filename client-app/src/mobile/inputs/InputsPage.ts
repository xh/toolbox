import {div, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import {
    buttonGroupInput,
    checkbox,
    checkboxButton,
    dateInput,
    numberInput,
    segmentedControl,
    switchInput,
    textArea,
    textInput
} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {ReactElement, ReactNode} from 'react';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './InputsPage.scss';
import {InputsPageModel} from './InputsPageModel';

export const inputsPage = hoistCmp.factory({
    model: creates(InputsPageModel),

    render() {
        return exampleScreen({
            title: 'Inputs',
            icon: Icon.edit(),
            description: [
                '`HoistInput` gives every editable control a common API - bind any input to observable',
                'state via the `model` and `bind` props, with consistent change / commit handling',
                'across the underlying Onsen widgets.',
                '',
                'Each card below shows an input with a few of its key props; the Disabled option applies',
                'to every input at once. See the dedicated `Forms` example for these inputs bound to a',
                '`FormModel` with validation.'
            ],
            options: [
                exampleOption({
                    label: 'Disabled',
                    control: switchInput({bind: 'disabled'}),
                    info: 'Disable every input on the page.'
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/inputs/InputsPage.ts', notes: 'This example.'},
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$HR/mobile/cmp/input',
                    text: 'Input package',
                    notes: 'The full set of mobile Hoist input components.'
                }
            ],
            item: panel({
                scrollable: true,
                className: 'tb-page tb-inputs-page',
                items: [textCard(), numbersCard(), dateCard(), choicesCard(), togglesCard()]
            })
        });
    }
});

//------------------------------------------------------------------
// Cards
//------------------------------------------------------------------
const textCard = hoistCmp.factory<InputsPageModel>(({model}) =>
    card('Text', [
        demoRow({
            label: 'TextInput',
            info: 'placeholder, leftIcon, enableClear',
            control: textInput({
                model,
                bind: 'email',
                disabled: model.disabled,
                placeholder: 'user@company.com',
                leftIcon: Icon.mail(),
                enableClear: true
            })
        }),
        demoRow({
            label: 'TextInput',
            info: 'type: password, selectOnFocus',
            control: textInput({
                model,
                bind: 'password',
                disabled: model.disabled,
                type: 'password',
                selectOnFocus: true
            })
        }),
        demoRow({
            label: 'TextArea',
            info: 'placeholder',
            control: textArea({
                model,
                bind: 'notes',
                disabled: model.disabled,
                placeholder: 'Tell us your thoughts...'
            })
        })
    ])
);

const numbersCard = hoistCmp.factory<InputsPageModel>(({model}) =>
    card('NumberInput', [
        demoRow({
            label: 'enableShorthandUnits, displayWithCommas',
            info: 'Type "2m" or "1.5b"',
            control: numberInput({
                model,
                bind: 'largeNumber',
                disabled: model.disabled,
                enableShorthandUnits: true,
                displayWithCommas: true,
                selectOnFocus: true
            })
        }),
        demoRow({
            label: 'scaleFactor, valueLabel',
            info: 'Stores 0-1, displays as %',
            control: numberInput({
                model,
                bind: 'percent',
                disabled: model.disabled,
                scaleFactor: 100,
                valueLabel: '%'
            })
        })
    ])
);

const dateCard = hoistCmp.factory<InputsPageModel>(({model}) =>
    card('DateInput', [
        demoRow({
            label: 'minDate, maxDate, enableClear',
            control: dateInput({
                model,
                bind: 'boundedDate',
                disabled: model.disabled,
                valueType: 'localDate',
                enableClear: true,
                minDate: LocalDate.today().subtract(5, 'weeks'),
                maxDate: LocalDate.today().add(2, 'weeks')
            })
        }),
        demoRow({
            label: 'valueType: localDate',
            control: dateInput({
                model,
                bind: 'simpleDate',
                disabled: model.disabled,
                valueType: 'localDate'
            })
        })
    ])
);

const choicesCard = hoistCmp.factory<InputsPageModel>(({model}) =>
    card('Choices', [
        demoRow({
            label: 'SegmentedControl',
            info: 'icon + text options',
            control: segmentedControl({
                model,
                bind: 'role',
                disabled: model.disabled,
                options: scOptions
            })
        }),
        demoRow({
            label: 'SegmentedControl',
            info: 'per-option intents',
            control: segmentedControl({
                model,
                bind: 'optionIntent',
                disabled: model.disabled,
                options: [
                    {label: 'Primary', value: 'primary', intent: 'primary'},
                    {label: 'Success', value: 'success', intent: 'success'},
                    {label: 'Warning', value: 'warning', intent: 'warning'},
                    {label: 'Danger', value: 'danger', intent: 'danger'}
                ]
            })
        }),
        demoRow({
            label: 'ButtonGroupInput',
            info: 'outlined, intent: primary',
            control: buttonGroupInput({
                model,
                bind: 'chartType',
                disabled: model.disabled,
                outlined: true,
                intent: 'primary',
                items: bgButtons()
            })
        })
    ])
);

const togglesCard = hoistCmp.factory<InputsPageModel>(({model}) =>
    card('Toggles', [
        demoRow({
            label: 'Checkbox',
            info: 'Basic boolean toggle',
            control: checkbox({model, bind: 'checkVal', disabled: model.disabled})
        }),
        demoRow({
            label: 'SwitchInput',
            info: 'iOS-style boolean toggle',
            control: switchInput({model, bind: 'switchVal', disabled: model.disabled})
        }),
        demoRow({
            label: 'CheckboxButton',
            info: 'Button-based boolean toggle',
            control: checkboxButton({
                model,
                bind: 'buttonVal',
                disabled: model.disabled,
                text: 'Enabled'
            })
        })
    ])
);

//------------------------------------------------------------------
// Shared option sets + helpers
//------------------------------------------------------------------
const scOptions = [
    {label: 'Trader', value: 'trader', icon: Icon.user()},
    {label: 'Strategy', value: 'strategy', icon: Icon.chessKnight()},
    {label: 'Fund', value: 'fund', icon: Icon.fund()}
];

const bgButtons = () => [
    button({icon: Icon.chartLine(), text: 'Linear', value: 'linear'}),
    button({icon: Icon.chartArea(), text: 'Area', value: 'area'}),
    button({icon: Icon.chartBar(), text: 'Bar', value: 'bar'})
];

function card(title: ReactNode, items: ReactNode[]): ReactElement {
    return div({
        className: 'tb-card',
        items: [div({className: 'tb-card__title', item: title}), ...items]
    });
}

interface DemoRowSpec {
    label: ReactNode;
    info?: ReactNode;
    control: ReactElement;
}

function demoRow({label, info, control}: DemoRowSpec): ReactElement {
    return vbox({
        className: 'tb-inputs-page__row',
        items: [
            span({className: 'tb-inputs-page__label', item: label}),
            info ? span({className: 'tb-inputs-page__info', item: info}) : null,
            div({className: 'tb-inputs-page__control', item: control})
        ]
    });
}
