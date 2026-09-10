import {filler, hbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, Intent, XH} from '@xh/hoist/core';
import {button, buttonGroup, ButtonProps} from '@xh/hoist/desktop/cmp/button';
import {intentInput, segmentedControl, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {ReactNode} from 'react';
import {
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    demoToolbar,
    DemoConfigProps,
    fmtDemoConfig,
    raw,
    wrapper,
    wrapperOption,
    wrapperOptionGroup
} from '../../common';

/** The three Button looks. `minimal` is the Hoist default; the others are opt-in. */
type ButtonStyle = 'minimal' | 'standard' | 'outlined';

const STYLE_PROPS: Record<ButtonStyle, Pick<ButtonProps, 'minimal' | 'outlined'>> = {
    minimal: {},
    standard: {minimal: false},
    outlined: {outlined: true}
};

/** The four Hoist intents, in their conventional order. */
const INTENTS: Intent[] = ['primary', 'success', 'warning', 'danger'];

export const buttonsPanel = hoistCmp.factory({
    displayName: 'ButtonsPanel',
    model: creates(() => ButtonsModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps, pgStyle} = model;
        return wrapper({
            title: 'Buttons',
            icon: Icon.checkCircle(),
            description: [
                'Hoist desktop Buttons wrap the Blueprint button and accept all of its props,',
                'adding layout support and a `minimal` default for reduced chrome.',
                '',
                'Three looks are available: `minimal` (the default), standard (`minimal: false`)',
                'and `outlined`. Each pairs with an optional `intent`.'
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/other/Buttons.ts', notes: 'This example.'},
                {url: '$HR/desktop/cmp/button/Button.ts', notes: 'Hoist component.'},
                {url: '$HR/desktop/cmp/button/ButtonGroup.ts', notes: 'Joins adjacent buttons.'},
                {
                    url: '$HR/desktop/cmp/input/ButtonGroupInput.ts',
                    notes: 'Bindable input that groups buttons into a single-select control.'
                }
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground only',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    info: 'Drives the Playground instance.',
                    items: [
                        wrapperOption({
                            label: 'Text',
                            propName: 'ButtonProps.text',
                            control: textInput({bind: 'pgText', width: 120, commitOnChange: true})
                        }),
                        wrapperOption({
                            label: 'Icon',
                            propName: 'ButtonProps.icon',
                            control: switchInput({bind: 'pgIcon'})
                        }),
                        wrapperOption({
                            label: 'Intent',
                            propName: 'ButtonProps.intent',
                            control: intentInput({bind: 'pgIntent', enableClear: true})
                        }),
                        wrapperOption({
                            label: 'Style',
                            propName: 'ButtonProps.minimal / outlined',
                            control: segmentedControl({
                                bind: 'pgStyle',
                                fill: false,
                                compact: true,
                                options: [
                                    {value: 'minimal', label: 'Minimal'},
                                    {value: 'standard', label: 'Standard'},
                                    {value: 'outlined', label: 'Outlined'}
                                ]
                            })
                        })
                    ]
                }),
                wrapperOptionGroup({
                    label: 'All buttons on the page',
                    items: [
                        wrapperOption({
                            label: 'Disabled',
                            propName: 'ButtonProps.disabled',
                            control: switchInput({bind: 'disabled'})
                        }),
                        wrapperOption({
                            label: 'Active',
                            propName: 'ButtonProps.active',
                            info: 'Pressed-in state, for toggle-like buttons.',
                            control: switchInput({bind: 'active'})
                        })
                    ]
                })
            ],
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 260,
                            showValue: false,
                            config: fmtDemoConfig<ButtonProps>('button', {
                                text: model.pgText || undefined,
                                icon: model.pgIcon ? raw('Icon.check()') : undefined,
                                intent: model.pgIntent || undefined,
                                ...styleSnippetProps(pgStyle),
                                ...ambientSnippetProps
                            }),
                            item: button({
                                ...ambientProps,
                                ...STYLE_PROPS[pgStyle],
                                text: model.pgText,
                                icon: model.pgIcon ? Icon.check() : null,
                                intent: model.pgIntent,
                                onClick: () => XH.toast({message: 'Clicked!'})
                            })
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        note: 'Each sets its own props.',
                        items: [
                            // The three looks lead the section at full width: each spans every
                            // intent, so they read as rows to compare top to bottom.
                            demoGrid({
                                columns: 1,
                                items: [
                                    intentRow(model, 'minimal', 'The Hoist default'),
                                    intentRow(model, 'standard', 'minimal: false'),
                                    intentRow(model, 'outlined', 'outlined: true')
                                ]
                            }),
                            demoGrid({
                                columns: 3,
                                items: [
                                    demoRow({
                                        label: 'Content shapes',
                                        info: 'text, icon, both, and rightIcon',
                                        item: buttonRow(
                                            button({...ambientProps, text: 'Text'}),
                                            button({
                                                ...ambientProps,
                                                icon: Icon.checkCircle(),
                                                tooltip: 'Icon only'
                                            }),
                                            button({
                                                ...ambientProps,
                                                icon: Icon.checkCircle(),
                                                text: 'Both'
                                            }),
                                            button({
                                                ...ambientProps,
                                                text: 'Menu',
                                                rightIcon: Icon.chevronDown()
                                            })
                                        )
                                    }),
                                    demoRow({
                                        label: 'Active',
                                        info: 'active: true - a pressed-in toggle, in each style',
                                        item: buttonRow(
                                            button({
                                                ...ambientProps,
                                                active: true,
                                                text: 'Minimal'
                                            }),
                                            button({
                                                ...ambientProps,
                                                ...STYLE_PROPS.standard,
                                                active: true,
                                                text: 'Standard'
                                            }),
                                            button({
                                                ...ambientProps,
                                                ...STYLE_PROPS.outlined,
                                                active: true,
                                                text: 'Outlined'
                                            })
                                        )
                                    }),
                                    demoRow({
                                        label: 'In a ButtonGroup',
                                        info: 'buttonGroup joins adjacent buttons - see ButtonGroupInput to bind one as a value',
                                        item: buttonGroup({
                                            items: [
                                                button({
                                                    ...ambientProps,
                                                    icon: Icon.chartLine(),
                                                    text: 'Linear'
                                                }),
                                                button({
                                                    ...ambientProps,
                                                    icon: Icon.chartArea(),
                                                    text: 'Area'
                                                }),
                                                button({
                                                    ...ambientProps,
                                                    icon: Icon.chartBar(),
                                                    text: 'Bar'
                                                })
                                            ]
                                        })
                                    })
                                ]
                            })
                        ]
                    }),
                    demoSection({
                        title: 'In a Toolbar',
                        note: 'Alongside the controls they usually sit with.',
                        items: [
                            demoToolbar({items: toolbarItems(model)}),
                            demoToolbar({compact: true, items: toolbarItems(model)})
                        ]
                    })
                ]
            })
        });
    }
});

//------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------
/** A variant card showing one Button style with no intent and then with each of them. */
function intentRow(model: ButtonsModel, style: ButtonStyle, info: string) {
    const {ambientProps} = model,
        styleProps = STYLE_PROPS[style];
    return demoRow({
        label: STYLE_LABELS[style],
        info,
        item: buttonRow(
            button({...ambientProps, ...styleProps, text: 'None'}),
            ...INTENTS.map(intent =>
                button({...ambientProps, ...styleProps, intent, text: capitalize(intent)})
            )
        )
    });
}

const STYLE_LABELS: Record<ButtonStyle, string> = {
    minimal: 'Minimal (default)',
    standard: 'Standard',
    outlined: 'Outlined'
};

/** Buttons wrap within a variant card rather than overflow it. */
function buttonRow(...items: ReactNode[]) {
    return hbox({gap: 6, alignItems: 'center', flexWrap: 'wrap', items});
}

/** Snippet entries for the chosen style - only the props that differ from the defaults. */
function styleSnippetProps(style: ButtonStyle): DemoConfigProps<ButtonProps> {
    return {
        minimal: style === 'standard' ? false : undefined,
        outlined: style === 'outlined' ? true : undefined
    };
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function toolbarItems(model: ButtonsModel): ReactNode[] {
    const {ambientProps} = model;
    return [
        button({...ambientProps, icon: Icon.add(), text: 'New', intent: 'success'}),
        button({...ambientProps, icon: Icon.edit(), text: 'Edit', intent: 'primary'}),
        toolbarSep(),
        buttonGroup({
            items: [
                button({...ambientProps, icon: Icon.chartLine(), tooltip: 'Linear'}),
                button({...ambientProps, icon: Icon.chartBar(), tooltip: 'Bar'})
            ]
        }),
        filler(),
        button({
            ...ambientProps,
            ...STYLE_PROPS.outlined,
            icon: Icon.download(),
            text: 'Export'
        }),
        button({...ambientProps, icon: Icon.skull(), text: 'Terminate', intent: 'danger'})
    ];
}

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class ButtonsModel extends HoistModel {
    // Playground props
    @bindable pgText = 'Submit';
    @bindable pgIcon = true;
    @bindable pgIntent: Intent = 'primary';
    @bindable pgStyle: ButtonStyle = 'minimal';

    /** Ambient - applied to every button on the page. */
    @bindable disabled = false;
    @bindable active = false;

    /** Props every button spreads so the ambient options reach it. */
    get ambientProps(): Pick<ButtonProps, 'disabled' | 'active'> {
        const {disabled, active} = this;
        return {disabled, active};
    }

    /** Ambient entries for a Playground snippet - shown only where they differ from the default. */
    get ambientSnippetProps(): DemoConfigProps<ButtonProps> {
        const {disabled, active} = this;
        return {disabled: disabled || undefined, active: active || undefined};
    }

    constructor() {
        super();
        makeObservable(this);
    }
}
