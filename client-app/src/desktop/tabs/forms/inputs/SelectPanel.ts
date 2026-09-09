import {form, FormModel} from '@xh/hoist/cmp/form';
import {box, div, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, managed, XH} from '@xh/hoist/core';
import {required} from '@xh/hoist/data';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {select, SelectProps, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {isUndefined} from 'lodash';
import {restaurants, usStates} from '../../../../core/data';
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

const ENTRY = inputEntry('Select');

// Varied label lengths so the windowed menu visibly auto-sizes to its widest content.
const LARGE_OPTIONS = Array.from(
    {length: 2000},
    (_, i) => `Item ${i + 1}${i % 7 === 0 ? ' - a longer descriptive option label' : ''}`
);

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

type StatusOption = (typeof STATUS_OPTIONS)[number];

const DESSERTS = [
    {label: 'Cookies', options: ['Oatmeal', 'Chocolate Chip', 'Peanut Butter']},
    {label: 'Cakes', options: ['Red Velvet', 'Tres Leches', "German's Chocolate", 'Cheesecake']},
    {label: 'Ice Cream', options: ['Vanilla', 'Chocolate', 'Strawberry']}
];

export const selectPanel = hoistCmp.factory({
    displayName: 'SelectPanel',
    model: creates(() => SelectPanelModel),

    render({model}) {
        const {ambientProps, ambientSnippetProps, pgMulti} = model,
            pgPlaceholder = pgMulti ? 'Select states...' : 'Select a state...';
        return inputDemoPage({
            entry: ENTRY,
            description: [
                '`Select` is a managed combobox/dropdown input supporting single and',
                'multi-value selection, async server-side queries, creatable entries, grouped',
                'options, and windowed rendering for large lists.',
                '',
                'For a more compact trigger suited to toolbars, see the companion `Picker`',
                'component.'
            ],
            links: [
                {
                    url: '$HR/cmp/input/README.md',
                    text: 'Inputs docs',
                    notes: 'Input components guide and shared concepts.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/inputs/SelectPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/input/Select.ts',
                    notes: 'Hoist Select component.'
                },
                {
                    url: '$HR/cmp/input/HoistInputModel.ts',
                    notes: 'Base class shared by all Hoist inputs.'
                }
            ],
            playgroundOptions: [
                wrapperOption({
                    label: 'Multi-select',
                    propName: 'SelectProps.enableMulti',
                    control: switchInput({bind: 'pgMulti'})
                }),
                wrapperOption({
                    label: 'Clear button',
                    propName: 'SelectProps.enableClear',
                    control: switchInput({bind: 'pgEnableClear'})
                }),
                wrapperOption({
                    label: 'Filter',
                    propName: 'SelectProps.enableFilter',
                    info: 'Type to narrow the menu.',
                    control: switchInput({bind: 'pgEnableFilter'})
                }),
                wrapperOption({
                    label: 'Left icon',
                    propName: 'SelectProps.leftIcon',
                    control: switchInput({bind: 'pgLeftIcon'})
                })
            ],
            playground: demoPlayground({
                config: fmtDemoConfig<SelectProps>('select', {
                    bind: 'value',
                    options: raw('usStates'),
                    enableMulti: pgMulti || undefined,
                    enableClear: model.pgEnableClear || undefined,
                    // enableFilter defaults to true - show it only when switched off.
                    enableFilter: model.pgEnableFilter ? undefined : false,
                    leftIcon: model.pgLeftIcon ? raw('Icon.globe()') : undefined,
                    placeholder: pgPlaceholder,
                    ...ambientSnippetProps
                }),
                value: model.playground,
                item: select({
                    bind: 'playground',
                    ...ambientProps,
                    options: usStates,
                    enableMulti: pgMulti,
                    enableClear: model.pgEnableClear,
                    enableFilter: model.pgEnableFilter,
                    leftIcon: model.pgLeftIcon ? Icon.globe() : null,
                    placeholder: pgPlaceholder,
                    width: '100%'
                })
            }),
            variants: [
                demoRow({
                    label: 'Simple options',
                    info: 'Primitive string options, enableClear',
                    item: select({
                        bind: 'simpleOption',
                        ...ambientProps,
                        options: ['Small', 'Medium', 'Large', 'X-Large'],
                        enableClear: true,
                        placeholder: 'Size...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Custom fields',
                    info: 'labelField + valueField on plain objects',
                    item: select({
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
                        enableClear: true,
                        placeholder: 'Pick a restaurant...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Async query',
                    info: 'queryFn with server-side customer search',
                    item: select({
                        bind: 'asyncValue',
                        ...ambientProps,
                        valueField: 'id',
                        labelField: 'company',
                        enableClear: true,
                        selectOnFocus: true,
                        queryFn: queryCustomersAsync,
                        optionRenderer: opt => customerOption({opt}),
                        placeholder: 'Search customers...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Creatable',
                    info: 'enableCreate - type a new entry',
                    item: select({
                        bind: 'creatableValue',
                        ...ambientProps,
                        options: restaurants,
                        enableCreate: true,
                        enableClear: true,
                        placeholder: 'Select or create...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Grouped options',
                    info: 'Nested option groups',
                    item: select({
                        bind: 'groupedValue',
                        ...ambientProps,
                        options: DESSERTS,
                        enableClear: true,
                        placeholder: 'Pick a dessert...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Custom renderer',
                    info: 'optionRenderer with status dots',
                    item: select({
                        bind: 'statusOption',
                        ...ambientProps,
                        options: STATUS_OPTIONS,
                        enableClear: true,
                        placeholder: 'Status...',
                        optionRenderer: (opt: StatusOption) =>
                            hbox({
                                alignItems: 'center',
                                flex: 1,
                                items: [
                                    statusDot(opt.color),
                                    vbox({
                                        flex: 1,
                                        items: [
                                            span(opt.label),
                                            span({
                                                className: 'xh-text-color-muted xh-font-size-small',
                                                item: opt.description
                                            })
                                        ]
                                    })
                                ]
                            }),
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Large list (windowed)',
                    info: 'enableWindowed - 2,000 items virtualized, menu auto-sizes to content',
                    item: select({
                        bind: 'bigValue',
                        ...ambientProps,
                        options: LARGE_OPTIONS,
                        enableWindowed: true,
                        enableClear: true,
                        placeholder: 'Select an item...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Search style',
                    info: 'hideDropdownIndicator, leftIcon',
                    item: select({
                        bind: 'searchStyle',
                        ...ambientProps,
                        options: restaurants,
                        hideDropdownIndicator: true,
                        leftIcon: Icon.search(),
                        enableClear: true,
                        placeholder: 'Search...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Tooltips (multi)',
                    info: 'enableTooltips on multi-select',
                    item: select({
                        bind: 'tooltipMulti',
                        ...ambientProps,
                        options: usStates,
                        enableMulti: true,
                        enableTooltips: true,
                        enableClear: true,
                        placeholder: 'States...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Menu on top',
                    info: "menuPlacement: 'top'",
                    item: select({
                        bind: 'menuTop',
                        ...ambientProps,
                        options: usStates,
                        menuPlacement: 'top',
                        enableClear: true,
                        placeholder: 'Opens upward...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Wide menu',
                    info: 'menuWidth: 350 - dropdown wider than input',
                    item: select({
                        bind: 'wideMenu',
                        ...ambientProps,
                        options: restaurants,
                        menuWidth: 350,
                        enableClear: true,
                        placeholder: 'Restaurant...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Open on focus',
                    info: 'openMenuOnFocus: true',
                    item: select({
                        bind: 'openOnFocus',
                        ...ambientProps,
                        options: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'],
                        openMenuOnFocus: true,
                        enableClear: true,
                        placeholder: 'Focus to open...',
                        width: '100%'
                    })
                }),
                demoRow({
                    label: 'Disabled',
                    info: 'disabled: true with pre-set value',
                    item: select({
                        bind: 'disabledState',
                        ...ambientProps,
                        options: usStates,
                        disabled: true,
                        width: '100%'
                    })
                })
            ],
            toolbarItems: () => [
                select({
                    bind: 'toolbarState',
                    ...ambientProps,
                    options: usStates,
                    enableClear: true,
                    placeholder: 'State...',
                    width: 200
                }),
                toolbarSep(),
                select({
                    bind: 'toolbarMulti',
                    ...ambientProps,
                    options: usStates,
                    enableMulti: true,
                    enableClear: true,
                    leftIcon: Icon.globe(),
                    placeholder: 'States...',
                    width: 300
                })
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
                                item: select({options: usStates, enableClear: true})
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
                                item: select({options: usStates, enableMulti: true})
                            })
                        })
                    })
                ]
            })
        });
    }
});

//------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------
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

const customerOption = hoistCmp.factory(({opt}) =>
    hbox({
        className: 'xh-pad-half xh-border-bottom',
        items: [
            box({
                item: isUndefined(opt.isActive)
                    ? Icon.magic({className: 'xh-grey'})
                    : opt.isActive
                      ? Icon.checkCircle({className: 'xh-green'})
                      : Icon.x({className: 'xh-red'}),
                width: 32,
                justifyContent: 'center'
            }),
            div(
                opt.company || opt.label,
                div({
                    omit: !opt.city || !opt.id,
                    className: 'xh-text-color-muted xh-font-size-small',
                    item: `${opt.city} · ID: ${opt.id}`
                })
            )
        ],
        alignItems: 'center',
        paddingLeft: 0
    })
);

async function queryCustomersAsync(query: string) {
    return XH.fetchJson({
        url: 'customer',
        params: {query}
    });
}

const SEEDS = {
    playground: null,
    simpleOption: null,
    restaurant: null,
    asyncValue: null,
    creatableValue: null,
    groupedValue: null,
    statusOption: null,
    bigValue: null,
    searchStyle: null,
    tooltipMulti: [],
    menuTop: null,
    wideMenu: null,
    openOnFocus: null,
    disabledState: 'CA',
    toolbarState: null,
    toolbarMulti: []
};

class SelectPanelModel extends InputDemoModel {
    // Playground props
    @bindable pgMulti = false;
    @bindable pgEnableClear = true;
    @bindable pgEnableFilter = true;
    @bindable pgLeftIcon = false;

    // Inputs
    @bindable.ref playground: string | string[] = SEEDS.playground;
    @bindable simpleOption: string = SEEDS.simpleOption;
    @bindable restaurant: string = SEEDS.restaurant;
    @bindable asyncValue: number = SEEDS.asyncValue;
    @bindable creatableValue: string = SEEDS.creatableValue;
    @bindable groupedValue: string = SEEDS.groupedValue;
    @bindable statusOption: string = SEEDS.statusOption;
    @bindable bigValue: string = SEEDS.bigValue;
    @bindable searchStyle: string = SEEDS.searchStyle;
    @bindable.ref tooltipMulti: string[] = SEEDS.tooltipMulti;
    @bindable menuTop: string = SEEDS.menuTop;
    @bindable wideMenu: string = SEEDS.wideMenu;
    @bindable openOnFocus: string = SEEDS.openOnFocus;
    @bindable disabledState: string = SEEDS.disabledState;
    @bindable toolbarState: string = SEEDS.toolbarState;
    @bindable.ref toolbarMulti: string[] = SEEDS.toolbarMulti;

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
