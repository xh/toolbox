import {badge} from '@xh/hoist/cmp/badge';
import {form, FormModel} from '@xh/hoist/cmp/form';
import {div, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, managed} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {picker, segmentedControl, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {usStates} from '../../../../core/data';
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
import './PickerPanel.scss';

const ENTRY = inputEntry('Picker');

const LARGE_OPTIONS = Array.from({length: 500}, (_, i) => `Item ${i + 1}`);

const STATUS_OPTIONS = [
    {
        label: 'Active',
        value: 'active',
        color: 'var(--xh-green)',
        description: 'Visible to all users'
    },
    {label: 'Pending', value: 'pending', color: 'var(--xh-orange)', description: 'Awaiting review'},
    {
        label: 'Inactive',
        value: 'inactive',
        color: 'var(--xh-red)',
        description: 'Hidden from searches'
    },
    {
        label: 'Archived',
        value: 'archived',
        color: 'var(--xh-text-color-muted)',
        description: 'Read-only, retained for audit'
    }
];

const statusDot = (color: string) =>
    div({
        style: {
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: color,
            marginRight: 8,
            flexShrink: 0
        }
    });

export const pickerPanel = hoistCmp.factory({
    displayName: 'PickerPanel',
    model: creates(() => PickerPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps} = model;
        return inputDemoPage({
            entry: ENTRY,
            description: [
                '`Picker` presents its options in a popover dropdown triggered by a compact',
                'button showing the current value or a summary. Supports single and',
                'multi-select modes.',
                '',
                'Designed for space-constrained areas such as toolbars, where a traditional',
                '`Select` component - especially in multi-select "tag picker" mode - is too',
                'wide. In multi-mode, displays a compact summary (e.g. "3 selected") rather',
                'than listing all selected values inline.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/PickerPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/input/Picker.ts', notes: 'Hoist Picker component.'},
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Multi-select',
                    propName: 'PickerProps.enableMulti',
                    control: switchInput({bind: 'pgMulti'})
                }),
                wrapperOption({
                    label: 'Clear',
                    propName: 'PickerProps.enableClear',
                    control: switchInput({bind: 'pgEnableClear'})
                }),
                wrapperOption({
                    label: 'Select all',
                    propName: 'PickerProps.enableSelectAll',
                    info: 'Multi only.',
                    control: switchInput({bind: 'pgSelectAll'})
                }),
                wrapperOption({
                    label: 'Button style',
                    propName: 'PickerProps.multiSelectButtonStyle',
                    control: segmentedControl({
                        bind: 'pgButtonStyle',
                        fill: false,
                        compact: true,
                        options: ['summary', 'values']
                    })
                }),
                wrapperOption({
                    label: 'Show count',
                    propName: 'PickerProps.multiSelectShowCount',
                    info: 'With the values style.',
                    control: switchInput({bind: 'pgShowCount'})
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig('picker', {
                    bind: 'value',
                    options: raw('usStates'),
                    enableMulti: model.pgMulti || undefined,
                    enableClear: model.pgEnableClear || undefined,
                    enableSelectAll: model.pgSelectAll || undefined,
                    multiSelectButtonStyle:
                        model.pgButtonStyle === 'summary' ? undefined : model.pgButtonStyle,
                    multiSelectShowCount: model.pgShowCount || undefined,
                    displayNoun: 'state',
                    buttonProps: raw('{icon: Icon.globe()}'),
                    width: 240,
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: picker({
                    bind: 'playground',
                    ...ambientProps,
                    options: usStates,
                    enableMulti: model.pgMulti,
                    enableClear: model.pgEnableClear,
                    enableSelectAll: model.pgSelectAll,
                    multiSelectButtonStyle: model.pgButtonStyle,
                    multiSelectShowCount: model.pgShowCount,
                    displayNoun: 'state',
                    buttonProps: {icon: Icon.globe()},
                    width: 240
                })
            }),
            variants: [
                demoRow({
                    label: 'Simple options',
                    info: 'Primitive string options, enableClear',
                    item: picker({
                        bind: 'simpleOption',
                        ...ambientProps,
                        options: ['Small', 'Medium', 'Large', 'X-Large'],
                        enableClear: true,
                        placeholder: 'Size...',
                        width: 140
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true',
                    item: picker({
                        bind: 'singleState',
                        ...ambientProps,
                        disabled: true,
                        options: usStates,
                        placeholder: 'Disabled...',
                        width: 200
                    })
                }),
                demoRow({
                    label: 'Minimal popover',
                    info: 'popoverMinimal: true - no arrow or border',
                    item: picker({
                        bind: 'minimalPopoverState',
                        ...ambientProps,
                        options: usStates,
                        popoverMinimal: true,
                        placeholder: 'Minimal...',
                        width: 200
                    })
                }),
                demoRow({
                    label: 'Custom fields',
                    info: 'labelField + valueField on plain objects',
                    item: picker({
                        bind: 'restaurant',
                        ...ambientProps,
                        options: [
                            {name: 'Osteria Francescana', city: 'Italy'},
                            {name: 'El Celler de Can Roca', city: 'Spain'},
                            {name: 'Mirazur', city: 'France'},
                            {name: 'Eleven Madison Park', city: 'NYC'},
                            {name: 'Gaggan', city: 'Thailand'},
                            {name: 'Central', city: 'Peru'}
                        ],
                        labelField: 'name',
                        valueField: 'name',
                        placeholder: 'Pick a restaurant...',
                        width: 240
                    })
                }),
                demoRow({
                    label: 'Badge count',
                    info: 'buttonTextRenderer with Hoist Badge',
                    item: picker({
                        bind: 'badgeStates',
                        ...ambientProps,
                        options: usStates,
                        enableMulti: true,
                        enableClear: true,
                        buttonProps: {icon: Icon.filter()},
                        width: 180,
                        placeholder: 'Filters...',
                        buttonTextRenderer: selected => {
                            if (!selected.length) return 'Filters...';
                            return hbox({
                                alignItems: 'center',
                                items: [
                                    span('Filters'),
                                    badge({
                                        compact: true,
                                        intent: 'primary',
                                        className: 'tb-picker-panel__badge',
                                        item: selected.length
                                    })
                                ]
                            });
                        }
                    })
                }),
                demoRow({
                    label: 'Custom renderers',
                    info: 'optionRenderer with two-line rows',
                    item: picker({
                        bind: 'statusOption',
                        ...ambientProps,
                        options: STATUS_OPTIONS,
                        placeholder: 'Status...',
                        enableFilter: false,
                        width: 200,
                        buttonTextRenderer: selected => {
                            if (!selected.length) return 'Status...';
                            const opt = selected[0] as any;
                            return hbox({
                                alignItems: 'center',
                                items: [statusDot(opt.color), span(opt.label)]
                            });
                        },
                        optionRenderer: (opt, isSelected) =>
                            hbox({
                                alignItems: 'center',
                                flex: 1,
                                items: [
                                    statusDot((opt as any).color),
                                    vbox({
                                        flex: 1,
                                        items: [
                                            span(opt.label),
                                            span({
                                                className: 'xh-text-color-muted xh-font-size-small',
                                                item: (opt as any).description
                                            })
                                        ]
                                    }),
                                    isSelected ? Icon.check({className: 'xh-intent-primary'}) : null
                                ]
                            })
                    })
                }),
                demoRow({
                    label: 'Popover width + stripes',
                    info: 'popoverWidth, stripeRows, rowBorders',
                    item: picker({
                        bind: 'wideState',
                        ...ambientProps,
                        options: usStates,
                        enableMulti: true,
                        enableClear: true,
                        stripeRows: true,
                        rowBorders: true,
                        popoverWidth: 300,
                        maxMenuHeight: 200,
                        placeholder: 'Wide popover...',
                        width: 200
                    })
                }),
                demoRow({
                    label: 'Not outlined',
                    info: 'buttonProps: {outlined: false}',
                    item: picker({
                        bind: 'nonMinimalState',
                        ...ambientProps,
                        options: usStates,
                        buttonProps: {outlined: false},
                        placeholder: 'Select...',
                        width: 200
                    })
                }),
                demoRow({
                    label: 'Large list (virtual)',
                    info: '500 options - virtualized via react-window',
                    item: picker({
                        bind: 'largeListValues',
                        ...ambientProps,
                        options: LARGE_OPTIONS,
                        enableMulti: true,
                        enableClear: true,
                        enableSelectAll: true,
                        displayNoun: 'item',
                        stripeRows: true,
                        width: 200
                    })
                }),
                demoRow({
                    label: 'Primary',
                    info: 'intent: primary',
                    item: picker({
                        bind: 'intentPrimary',
                        ...ambientProps,
                        options: usStates,
                        buttonProps: {icon: Icon.globe(), intent: 'primary'},
                        placeholder: 'Region...',
                        width: 180
                    })
                }),
                demoRow({
                    label: 'Success',
                    info: 'intent: success',
                    item: picker({
                        bind: 'intentSuccess',
                        ...ambientProps,
                        options: usStates,
                        buttonProps: {icon: Icon.checkCircle(), intent: 'success'},
                        placeholder: 'Approved...',
                        width: 180
                    })
                }),
                demoRow({
                    label: 'Warning',
                    info: 'intent: warning',
                    item: picker({
                        bind: 'intentWarning',
                        ...ambientProps,
                        options: usStates,
                        buttonProps: {icon: Icon.warning(), intent: 'warning'},
                        placeholder: 'Review...',
                        width: 180
                    })
                }),
                demoRow({
                    label: 'Danger',
                    info: 'intent: danger',
                    item: picker({
                        bind: 'intentDanger',
                        ...ambientProps,
                        options: usStates,
                        buttonProps: {icon: Icon.skull(), intent: 'danger'},
                        placeholder: 'Critical...',
                        width: 180
                    })
                })
            ],
            toolbarItems: compact => [
                picker({
                    bind: 'toolbarStates',
                    ...ambientProps,
                    compact,
                    options: usStates,
                    enableMulti: true,
                    enableClear: true,
                    enableSelectAll: true,
                    displayNoun: 'state',
                    buttonProps: {icon: Icon.globe()},
                    width: 200
                }),
                toolbarSep(),
                picker({
                    bind: 'toolbarPriority',
                    ...ambientProps,
                    compact,
                    options: ['Critical', 'High', 'Medium', 'Low'],
                    placeholder: 'Priority...',
                    buttonProps: {icon: Icon.flag()}
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
                                field: 'state',
                                item: picker({options: usStates})
                            })
                        })
                    }),
                    demoFrame({
                        info: 'Inline label, validation message below the field',
                        item: form({
                            model: model.formModel,
                            item: formField({
                                field: 'states',
                                inline: true,
                                item: picker({
                                    options: usStates,
                                    enableMulti: true,
                                    displayNoun: 'state'
                                })
                            })
                        })
                    })
                ]
            })
        });
    }
});

const SEEDS = {
    playground: [],
    simpleOption: null,
    singleState: null,
    minimalPopoverState: null,
    restaurant: null,
    badgeStates: [],
    statusOption: null,
    wideState: [],
    nonMinimalState: null,
    largeListValues: [],
    intentPrimary: null,
    intentSuccess: null,
    intentWarning: null,
    intentDanger: null,
    toolbarStates: [],
    toolbarPriority: null
};

class PickerPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgMulti = true;
    @bindable pgEnableClear = true;
    @bindable pgSelectAll = true;
    @bindable pgButtonStyle: 'summary' | 'values' = 'summary';
    @bindable pgShowCount = false;

    // Inputs
    @bindable.ref playground: string | string[] = SEEDS.playground;
    @bindable simpleOption: string = SEEDS.simpleOption;
    @bindable singleState: string = SEEDS.singleState;
    @bindable minimalPopoverState: string = SEEDS.minimalPopoverState;
    @bindable restaurant: string = SEEDS.restaurant;
    @bindable.ref badgeStates: string[] = SEEDS.badgeStates;
    @bindable statusOption: string = SEEDS.statusOption;
    @bindable.ref wideState: string[] = SEEDS.wideState;
    @bindable nonMinimalState: string = SEEDS.nonMinimalState;
    @bindable.ref largeListValues: string[] = SEEDS.largeListValues;
    @bindable intentPrimary: string = SEEDS.intentPrimary;
    @bindable intentSuccess: string = SEEDS.intentSuccess;
    @bindable intentWarning: string = SEEDS.intentWarning;
    @bindable intentDanger: string = SEEDS.intentDanger;
    @bindable.ref toolbarStates: string[] = SEEDS.toolbarStates;
    @bindable toolbarPriority: string = SEEDS.toolbarPriority;

    @managed
    override formModel = new FormModel({
        fields: [
            {name: 'state', displayName: 'State', initialValue: 'CA', rules: [required]},
            {name: 'states', displayName: 'States', initialValue: [], rules: [required]}
        ]
    });

    get inputSeeds() {
        return SEEDS;
    }

    constructor() {
        super({supportsCompact: true, commitOnChangeDefault: null});
        makeObservable(this);
        // Multi and single modes hold different value shapes - reset the value when it flips.
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
