import {filler, hbox} from '@xh/hoist/cmp/layout';
import type {ComponentSize, Intent} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, TaskObserver, XH} from '@xh/hoist/core';
import type {ButtonProps} from '@xh/hoist/cmp/button';
import {button, buttonGroup, splitButton} from '@xh/hoist/cmp/button';
import {intentInput, segmentedControl, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import type {ReactNode} from 'react';
import type {DemoConfigProps} from '../../../common/Demo';
import {
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    demoToolbar,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';

/** The three Button looks. `minimal` is the Hoist default; the others are opt-in. */
type ButtonStyle = 'minimal' | 'standard' | 'outlined';

const STYLE_PROPS: Record<ButtonStyle, Pick<ButtonProps, 'minimal' | 'outlined'>> = {
    minimal: {},
    standard: {minimal: false},
    outlined: {outlined: true}
};

const SIZES: ComponentSize[] = ['compact', 'standard', 'large'];

const SAVE_MENU_ITEMS = [
    {text: 'Save As...', icon: Icon.copy(), actionFn: () => XH.toast({message: 'Save As...'})},
    {text: 'Save a Copy', icon: Icon.add(), actionFn: () => XH.toast({message: 'Saved a copy'})}
];

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
                'Hoist Buttons are shared by desktop and mobile, with layout support and a `minimal`',
                'default on desktop for reduced chrome.',
                '',
                'Three looks are available: `minimal` (the default), standard (`minimal: false`)',
                'and `outlined`. Each pairs with an optional `intent`, and comes in three sizes.',
                '`loading` shows a spinner while a task runs, and `splitButton` joins a primary',
                'action to a menu of related ones.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/ButtonsPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/button/Button.ts', notes: 'Hoist component.'},
                {url: '$HR/cmp/button/ButtonGroup.ts', notes: 'Joins adjacent buttons.'},
                {
                    url: '$HR/cmp/button/SplitButton.ts',
                    notes: 'A button with a menu of related actions.'
                },
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
                    children: [
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
                            label: 'Size',
                            propName: 'ButtonProps.size',
                            control: segmentedControl({
                                bind: 'pgSize',
                                fill: false,
                                compact: true,
                                options: [
                                    {value: 'compact', label: 'Compact'},
                                    {value: 'standard', label: 'Standard'},
                                    {value: 'large', label: 'Large'}
                                ]
                            })
                        }),
                        wrapperOption({
                            label: 'Loading',
                            propName: 'ButtonProps.loading',
                            control: switchInput({bind: 'pgLoading'})
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
                    children: [
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
            children: demoPanel({
                children: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        children: demoPlayground({
                            instanceWidth: 260,
                            showValue: false,
                            config: fmtDemoConfig<ButtonProps>('button', {
                                text: model.pgText || undefined,
                                icon: model.pgIcon ? raw('Icon.check()') : undefined,
                                intent: model.pgIntent || undefined,
                                size: model.pgSize !== 'standard' ? model.pgSize : undefined,
                                loading: model.pgLoading || undefined,
                                ...styleSnippetProps(pgStyle),
                                ...ambientSnippetProps
                            }),
                            children: button({
                                ...ambientProps,
                                ...STYLE_PROPS[pgStyle],
                                text: model.pgText,
                                icon: model.pgIcon ? Icon.check() : null,
                                intent: model.pgIntent,
                                size: model.pgSize,
                                loading: model.pgLoading,
                                onClick: () => XH.toast({message: 'Clicked!'})
                            })
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        note: 'Each sets its own props.',
                        children: [
                            // The three looks lead the section at full width: each spans every
                            // intent, so they read as rows to compare top to bottom.
                            demoGrid({
                                columns: 1,
                                children: [
                                    intentRow(model, 'minimal', 'The Hoist default'),
                                    intentRow(model, 'standard', 'minimal: false'),
                                    intentRow(model, 'outlined', 'outlined: true')
                                ]
                            }),
                            demoGrid({
                                columns: 3,
                                children: [
                                    demoRow({
                                        label: 'Content shapes',
                                        info: 'text, icon, both, and rightIcon',
                                        children: buttonRow(
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
                                        children: buttonRow(
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
                                        label: 'Sizes',
                                        info: "size: 'compact', 'standard' (the default) or 'large'",
                                        children: buttonRow(
                                            ...SIZES.map(size =>
                                                button({
                                                    ...ambientProps,
                                                    ...STYLE_PROPS.standard,
                                                    size,
                                                    icon: Icon.checkCircle(),
                                                    text: capitalize(size)
                                                })
                                            )
                                        )
                                    }),
                                    demoRow({
                                        label: 'Loading',
                                        info: 'loading: true or a TaskObserver - the spinner takes the icon, or covers the content',
                                        children: buttonRow(
                                            button({
                                                ...ambientProps,
                                                ...STYLE_PROPS.standard,
                                                intent: 'primary',
                                                icon: Icon.check(),
                                                text: 'Save',
                                                loading: model.saveTask,
                                                onClick: () => model.saveAsync()
                                            }),
                                            button({
                                                ...ambientProps,
                                                ...STYLE_PROPS.outlined,
                                                text: 'Submit',
                                                loading: model.saveTask,
                                                onClick: () => model.saveAsync()
                                            }),
                                            button({
                                                ...ambientProps,
                                                icon: Icon.refresh(),
                                                tooltip: 'Refresh',
                                                loading: model.saveTask,
                                                onClick: () => model.saveAsync()
                                            })
                                        )
                                    }),
                                    demoRow({
                                        label: 'SplitButton',
                                        info: 'splitButton joins a primary action to a menu of related ones',
                                        children: buttonRow(
                                            splitButton({
                                                ...ambientProps,
                                                icon: Icon.check(),
                                                text: 'Save',
                                                onClick: () => model.saveAsync(),
                                                loading: model.saveTask,
                                                menuItems: SAVE_MENU_ITEMS
                                            }),
                                            splitButton({
                                                ...ambientProps,
                                                ...STYLE_PROPS.standard,
                                                intent: 'primary',
                                                icon: Icon.check(),
                                                text: 'Save',
                                                onClick: () => model.saveAsync(),
                                                loading: model.saveTask,
                                                menuItems: SAVE_MENU_ITEMS
                                            }),
                                            splitButton({
                                                ...ambientProps,
                                                ...STYLE_PROPS.outlined,
                                                text: 'Export',
                                                icon: Icon.download(),
                                                onClick: () => XH.toast({message: 'Exported'}),
                                                menuItems: [
                                                    {
                                                        text: 'Export to Excel',
                                                        icon: Icon.fileExcel(),
                                                        actionFn: () =>
                                                            XH.toast({message: 'Exported to Excel'})
                                                    },
                                                    {
                                                        text: 'Export to CSV',
                                                        icon: Icon.fileCsv(),
                                                        actionFn: () =>
                                                            XH.toast({message: 'Exported to CSV'})
                                                    }
                                                ]
                                            })
                                        )
                                    }),
                                    demoRow({
                                        label: 'In a ButtonGroup',
                                        info: 'buttonGroup joins adjacent buttons - see ButtonGroupInput to bind one as a value',
                                        children: buttonGroup({
                                            children: [
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
                        children: [
                            demoToolbar({children: toolbarItems(model)}),
                            demoToolbar({compact: true, children: toolbarItems(model)})
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
        children: buttonRow(
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
    return hbox({gap: 6, alignItems: 'center', flexWrap: 'wrap', children: items});
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
            children: [
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
    @bindable accessor pgText = 'Submit';
    @bindable accessor pgIcon = true;
    @bindable accessor pgIntent: Intent = 'primary';
    @bindable accessor pgStyle: ButtonStyle = 'minimal';
    @bindable accessor pgSize: ComponentSize = 'standard';
    @bindable accessor pgLoading = false;

    /** Tracks the demo save, so the Loading buttons show their spinner while it runs. */
    saveTask = TaskObserver.trackLast();

    async saveAsync() {
        await wait(2000).linkTo(this.saveTask);
        XH.toast({message: 'Saved'});
    }

    /** Ambient - applied to every button on the page. */
    @bindable accessor disabled = false;
    @bindable accessor active = false;

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
}
