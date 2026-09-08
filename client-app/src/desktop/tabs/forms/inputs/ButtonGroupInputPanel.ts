import {form, FormModel} from '@xh/hoist/cmp/form';
import {creates, hoistCmp, Intent, managed} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {buttonGroupInput, intentInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {
    demoFrame,
    demoGrid,
    demoPlayground,
    demoRow,
    fmtDemoConfig,
    raw,
    wrapperOption
} from '../../../common';
import {inputEntry} from './InputCatalog';
import {InputDemoModel} from './InputDemoModel';
import {inputDemoPage} from './InputDemoPage';

const ENTRY = inputEntry('ButtonGroupInput');

/** Child buttons shared by the Playground and several variants - built fresh per instance. */
const chartButtons = () => [
    button({icon: Icon.chartLine(), text: 'Linear', value: 'linear'}),
    button({icon: Icon.chartArea(), text: 'Area', value: 'area'}),
    button({icon: Icon.chartBar(), text: 'Bar', value: 'bar'})
];

/** Child buttons for the icon-only view toggles in the toolbar and form sections. */
const viewButtons = () => [
    button({icon: Icon.grid(), value: 'grid'}),
    button({icon: Icon.list(), value: 'list'})
];

export const buttonGroupInputPanel = hoistCmp.factory({
    displayName: 'ButtonGroupInputPanel',
    model: creates(() => ButtonGroupInputPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps} = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                'A row of `button`s acting as a value - each child button carries a `value`, and',
                'the group selects one (or several with `enableMulti`). Intent and outlined',
                'styling flow to the buttons.',
                '',
                'Compare with `SegmentedControl` for a tray-style single choice driven by an',
                '`options` array.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/ButtonGroupInputPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/input/ButtonGroupInput.ts', notes: 'Hoist component.'},
                {url: '$HR/desktop/cmp/button/Button.ts', notes: 'Child button props.'},
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Outlined',
                    propName: 'ButtonGroupInputProps.outlined',
                    control: switchInput({bind: 'pgOutlined'})
                }),
                wrapperOption({
                    label: 'Multi-select',
                    propName: 'ButtonGroupInputProps.enableMulti',
                    info: 'Value becomes an array.',
                    control: switchInput({bind: 'pgMulti'})
                }),
                wrapperOption({
                    label: 'Clear on reselect',
                    propName: 'ButtonGroupInputProps.enableClear',
                    info: 'Clicking the selected button clears it.',
                    control: switchInput({bind: 'pgEnableClear'})
                }),
                wrapperOption({
                    label: 'Intent',
                    propName: 'ButtonGroupInputProps.intent',
                    control: intentInput({bind: 'pgIntent', enableClear: true})
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig('buttonGroupInput', {
                    bind: 'value',
                    outlined: model.pgOutlined || undefined,
                    enableMulti: model.pgMulti || undefined,
                    enableClear: model.pgEnableClear || undefined,
                    intent: model.pgIntent || undefined,
                    items: raw('chartButtons()'),
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: buttonGroupInput({
                    bind: 'playground',
                    ...ambientProps,
                    outlined: model.pgOutlined,
                    enableMulti: model.pgMulti,
                    enableClear: model.pgEnableClear,
                    intent: model.pgIntent ?? undefined,
                    items: chartButtons()
                })
            }),
            variants: [
                demoRow({
                    label: 'Icon and text',
                    info: 'No props beyond bind',
                    item: buttonGroupInput({
                        bind: 'plain',
                        ...ambientProps,
                        items: chartButtons()
                    })
                }),
                demoRow({
                    label: 'Icons only',
                    info: 'Buttons with icon and title, no text',
                    item: buttonGroupInput({
                        bind: 'iconsOnly',
                        ...ambientProps,
                        items: [
                            button({icon: Icon.chartLine(), title: 'Linear', value: 'linear'}),
                            button({icon: Icon.chartArea(), title: 'Area', value: 'area'}),
                            button({icon: Icon.chartBar(), title: 'Bar', value: 'bar'})
                        ]
                    })
                }),
                demoRow({
                    label: 'Text only',
                    info: 'Buttons with text, no icons',
                    item: buttonGroupInput({
                        bind: 'textOnly',
                        ...ambientProps,
                        items: [
                            button({text: 'Linear', value: 'linear'}),
                            button({text: 'Area', value: 'area'}),
                            button({text: 'Bar', value: 'bar'})
                        ]
                    })
                }),
                demoRow({
                    label: 'Outlined primary',
                    info: "outlined: true, intent: 'primary'",
                    item: buttonGroupInput({
                        bind: 'outlinedPrimary',
                        ...ambientProps,
                        outlined: true,
                        intent: 'primary',
                        items: chartButtons()
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: buttonGroupInput({
                        bind: 'disabledChart',
                        ...ambientProps,
                        disabled: true,
                        items: chartButtons()
                    })
                }),
                demoRow({
                    label: 'Invalid',
                    info: 'Bound to a failing FormField rule',
                    item: form({
                        model: model.formModel,
                        item: formField({
                            field: 'invalidChart',
                            label: null,
                            minimal: true,
                            item: buttonGroupInput({items: chartButtons()})
                        })
                    })
                })
            ],
            toolbarItems: () => [
                buttonGroupInput({bind: 'tbarChart', ...ambientProps, items: chartButtons()}),
                toolbarSep(),
                buttonGroupInput({
                    bind: 'tbarView',
                    ...ambientProps,
                    outlined: true,
                    items: viewButtons()
                }),
                toolbarSep(),
                button({text: 'Apply', icon: Icon.filter()})
            ],
            form: demoGrid({
                columns: 2,
                items: [
                    demoFrame({
                        info: 'FormField, label above, required rule satisfied',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'chartType',
                                item: buttonGroupInput({items: chartButtons()})
                            })
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'view',
                                inline: true,
                                item: buttonGroupInput({items: viewButtons()})
                            })
                        })
                    })
                ]
            })
        });
    }
});

const SEEDS = {
    playground: 'area',
    plain: 'area',
    iconsOnly: 'bar',
    textOnly: 'linear',
    outlinedPrimary: 'area',
    disabledChart: 'area',
    tbarChart: null,
    tbarView: null
};

class ButtonGroupInputPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgOutlined = false;
    @bindable pgMulti = false;
    @bindable pgEnableClear = false;
    @bindable pgIntent: Intent = null;

    // Inputs
    @bindable.ref playground: string | string[] = SEEDS.playground;
    @bindable plain: string = SEEDS.plain;
    @bindable iconsOnly: string = SEEDS.iconsOnly;
    @bindable textOnly: string = SEEDS.textOnly;
    @bindable outlinedPrimary: string = SEEDS.outlinedPrimary;
    @bindable disabledChart: string = SEEDS.disabledChart;
    @bindable tbarChart: string = SEEDS.tbarChart;
    @bindable tbarView: string = SEEDS.tbarView;

    @managed
    override formModel = new FormModel({
        fields: [
            {
                name: 'chartType',
                displayName: 'Chart type',
                initialValue: 'area',
                rules: [required]
            },
            {name: 'view', displayName: 'View', initialValue: null, rules: [required]},
            {name: 'invalidChart', initialValue: null, rules: [required]}
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super({commitOnChangeDefault: null});
        makeObservable(this);
        // Playground value type flips between string and string[] with multi-select - reset it
        // whenever that toggle changes, since a stale value would no longer match the input's
        // mode.
        this.addReaction({
            track: () => this.pgMulti,
            run: multi => (this.playground = multi ? [] : null)
        });
        // Show the failing rules on load - FormField displays messages only after validation runs.
        this.formModel.validateAsync();
    }

    override resetInputs() {
        super.resetInputs();
        this.playground = this.pgMulti ? [] : null;
    }
}
