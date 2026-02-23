import {box, code, div, hbox, hframe, p, span, vbox} from '@xh/hoist/cmp/layout';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, lookup, XH} from '@xh/hoist/core';
import {select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {isUndefined} from 'lodash';
import {restaurants, usStates} from '../../../core/data';
import {wrapper} from '../../common';
import './SelectPanel.scss';

const LARGE_OPTIONS = Array.from({length: 2000}, (_, i) => `Item ${i + 1}`);

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

const DESSERTS = [
    {label: 'Cookies', options: ['Oatmeal', 'Chocolate Chip', 'Peanut Butter']},
    {label: 'Cakes', options: ['Red Velvet', 'Tres Leches', "German's Chocolate", 'Cheesecake']},
    {label: 'Ice Cream', options: ['Vanilla', 'Chocolate', 'Strawberry']}
];

export const selectPanel = hoistCmp.factory({
    displayName: 'SelectPanel',
    model: creates(() => SelectPanelModel),

    render({model}) {
        return wrapper({
            description: [
                p(
                    code('Select'),
                    ' is a managed combobox/dropdown input supporting single and multi-value selection, async server-side queries, creatable entries, grouped options, and windowed rendering for large lists.'
                ),
                p(
                    'For a more compact trigger suited to toolbars, see the companion ',
                    code({
                        className: 'tb-code-link',
                        onClick: () => model.tabContainerModel.activateTab('popoverPicker'),
                        item: 'PopoverPicker'
                    }),
                    ' component.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/SelectPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/input/Select.ts',
                    notes: 'Hoist Select component.'
                }
            ],
            item: panel({
                title: 'Forms › Select',
                icon: Icon.list(),
                width: '90%',
                maxWidth: 1100,
                scrollable: true,
                item: hframe(column1(), column2(), column3()),
                tbar: selectToolbar(),
                bbar: compactToolbar()
            })
        });
    }
});

//------------------------------------------------------------------
// Toolbar demonstrating selects in a real-world toolbar context
//------------------------------------------------------------------
const selectToolbar = hoistCmp.factory<SelectPanelModel>(() =>
    toolbar(
        select({
            bind: 'toolbarState',
            options: usStates,
            enableClear: true,
            placeholder: 'State...',
            width: 200
        }),
        toolbarSep(),
        select({
            bind: 'toolbarMulti',
            options: usStates,
            enableMulti: true,
            enableClear: true,
            leftIcon: Icon.globe(),
            placeholder: 'States...',
            width: 300
        })
    )
);

//------------------------------------------------------------------
// Compact bottom toolbar
//------------------------------------------------------------------
const compactToolbar = hoistCmp.factory<SelectPanelModel>(() =>
    toolbar({
        compact: true,
        items: [
            select({
                bind: 'toolbarState',
                options: usStates,
                enableClear: true,
                placeholder: 'State...',
                width: 180
            }),
            toolbarSep(),
            select({
                bind: 'toolbarMulti',
                options: usStates,
                enableMulti: true,
                enableClear: true,
                leftIcon: Icon.globe(),
                placeholder: 'States...',
                width: 280
            })
        ]
    })
);

//------------------------------------------------------------------
// Column 1: Single & multi-select basics
//------------------------------------------------------------------
const column1 = hoistCmp.factory<SelectPanelModel>(() =>
    vbox({
        flex: 1,
        padding: 20,
        items: [
            demoRow({
                label: 'Single select',
                info: 'Basic with usStates, enableClear',
                item: select({
                    bind: 'singleState',
                    options: usStates,
                    enableClear: true,
                    placeholder: 'Select a state...',
                    width: 200
                })
            }),
            demoRow({
                label: 'Multi-select',
                info: 'enableMulti, enableClear — tag picker mode',
                item: select({
                    bind: 'multiStates',
                    options: usStates,
                    enableMulti: true,
                    enableClear: true,
                    placeholder: 'Select states...',
                    width: 300
                })
            }),
            demoRow({
                label: 'Simple options',
                info: 'Primitive string options, enableClear',
                item: select({
                    bind: 'simpleOption',
                    options: ['Small', 'Medium', 'Large', 'X-Large'],
                    enableClear: true,
                    placeholder: 'Size...',
                    width: 160
                })
            }),
            demoRow({
                label: 'Disabled',
                info: 'disabled: true with pre-set value',
                item: select({
                    bind: 'disabledState',
                    options: usStates,
                    disabled: true,
                    width: 200
                })
            }),
            demoRow({
                label: 'Left icon',
                info: 'leftIcon for a search-field look',
                item: select({
                    bind: 'leftIconValue',
                    options: restaurants,
                    leftIcon: Icon.search(),
                    enableClear: true,
                    placeholder: 'Search restaurants...',
                    width: 280
                })
            })
        ]
    })
);

//------------------------------------------------------------------
// Column 2: Advanced features
//------------------------------------------------------------------
const column2 = hoistCmp.factory<SelectPanelModel>(() =>
    vbox({
        flex: 1,
        padding: 20,
        items: [
            demoRow({
                label: 'Custom fields',
                info: 'labelField + valueField on plain objects',
                item: select({
                    bind: 'restaurant',
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
                    width: 240
                })
            }),
            demoRow({
                label: 'Async query',
                info: 'queryFn with server-side customer search',
                item: select({
                    bind: 'asyncValue',
                    valueField: 'id',
                    labelField: 'company',
                    enableClear: true,
                    selectOnFocus: true,
                    queryFn: queryCustomersAsync,
                    optionRenderer: opt => customerOption({opt}),
                    placeholder: 'Search customers...',
                    width: 280
                })
            }),
            demoRow({
                label: 'Creatable',
                info: 'enableCreate — type a new entry',
                item: select({
                    bind: 'creatableValue',
                    options: restaurants,
                    enableCreate: true,
                    enableClear: true,
                    placeholder: 'Select or create...',
                    width: 280
                })
            }),
            demoRow({
                label: 'Grouped options',
                info: 'Nested option groups',
                item: select({
                    bind: 'groupedValue',
                    options: DESSERTS,
                    enableClear: true,
                    placeholder: 'Pick a dessert...',
                    width: 220
                })
            }),
            demoRow({
                label: 'Custom renderer',
                info: 'optionRenderer with status dots',
                item: select({
                    bind: 'statusOption',
                    options: STATUS_OPTIONS,
                    enableClear: true,
                    placeholder: 'Status...',
                    optionRenderer: opt =>
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
                                })
                            ]
                        }),
                    width: 220
                })
            }),
            demoRow({
                label: 'Large list (windowed)',
                info: 'enableWindowed — 2,000 items virtualized',
                item: select({
                    bind: 'bigValue',
                    options: LARGE_OPTIONS,
                    enableWindowed: true,
                    enableClear: true,
                    placeholder: 'Select an item...',
                    width: 220
                })
            })
        ]
    })
);

//------------------------------------------------------------------
// Column 3: Appearance & behavior
//------------------------------------------------------------------
const column3 = hoistCmp.factory<SelectPanelModel>(() =>
    vbox({
        flex: 1,
        padding: 20,
        items: [
            demoRow({
                label: 'Search style',
                info: 'hideDropdownIndicator, leftIcon',
                item: select({
                    bind: 'searchStyle',
                    options: restaurants,
                    hideDropdownIndicator: true,
                    leftIcon: Icon.search(),
                    enableClear: true,
                    placeholder: 'Search...',
                    width: 260
                })
            }),
            demoRow({
                label: 'Tooltips (multi)',
                info: 'enableTooltips on narrow multi-select',
                item: select({
                    bind: 'tooltipMulti',
                    options: usStates,
                    enableMulti: true,
                    enableTooltips: true,
                    enableClear: true,
                    placeholder: 'States...',
                    width: 180
                })
            }),
            demoRow({
                label: 'Menu on top',
                info: "menuPlacement: 'top'",
                item: select({
                    bind: 'menuTop',
                    options: usStates,
                    menuPlacement: 'top',
                    enableClear: true,
                    placeholder: 'Opens upward...',
                    width: 200
                })
            }),
            demoRow({
                label: 'Wide menu',
                info: 'menuWidth: 350 — dropdown wider than input',
                item: select({
                    bind: 'wideMenu',
                    options: restaurants,
                    menuWidth: 350,
                    enableClear: true,
                    placeholder: 'Restaurant...',
                    width: 200
                })
            }),
            demoRow({
                label: 'Open on focus',
                info: 'openMenuOnFocus: true',
                item: select({
                    bind: 'openOnFocus',
                    options: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'],
                    openMenuOnFocus: true,
                    enableClear: true,
                    placeholder: 'Focus to open...',
                    width: 200
                })
            })
        ]
    })
);

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

const demoRow = hoistCmp.factory(({label, info, children}) =>
    vbox({
        className: 'tb-select-panel__row',
        items: [
            span({className: 'tb-select-panel__label', item: label}),
            span({
                className: 'xh-text-color-muted xh-font-size-small',
                style: {marginTop: 2},
                item: info
            }),
            div({style: {marginTop: 6}, item: children})
        ]
    })
);

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class SelectPanelModel extends HoistModel {
    @lookup(TabContainerModel) tabContainerModel: TabContainerModel;

    // Toolbar
    @bindable toolbarState: string = null;
    @bindable toolbarMulti: string[] = [];

    // Column 1
    @bindable singleState: string = null;
    @bindable multiStates: string[] = [];
    @bindable simpleOption: string = null;
    @bindable disabledState: string = 'California';
    @bindable leftIconValue: string = null;

    // Column 2
    @bindable restaurant: string = null;
    @bindable asyncValue: number = null;
    @bindable creatableValue: string = null;
    @bindable groupedValue: string = null;
    @bindable statusOption: string = null;
    @bindable bigValue: string = null;

    // Column 3
    @bindable searchStyle: string = null;
    @bindable tooltipMulti: string[] = [];
    @bindable menuTop: string = null;
    @bindable wideMenu: string = null;
    @bindable openOnFocus: string = null;

    constructor() {
        super();
        makeObservable(this);
    }
}
