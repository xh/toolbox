import {badge} from '@xh/hoist/cmp/badge';
import {code, div, hbox, hframe, p, span, vbox} from '@xh/hoist/cmp/layout';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, lookup} from '@xh/hoist/core';
import {picker} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {usStates} from '../../../core/data';
import {wrapper} from '../../common';
import './PickerPanel.scss';

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

export const pickerPanel = hoistCmp.factory({
    displayName: 'PickerPanel',
    model: creates(() => PickerPanelModel),

    render({model}) {
        return wrapper({
            description: [
                p(
                    code('Picker'),
                    ' presents its options in a popover dropdown triggered by a compact button showing the current value or a summary. Supports single and multi-select modes.'
                ),
                p(
                    'Designed for space-constrained areas such as toolbars, where a traditional ',
                    code({
                        className: 'tb-code-link',
                        onClick: () => model.tabContainerModel.activateTab('select'),
                        item: 'Select'
                    }),
                    ' component — especially in multi-select "tag picker" mode — is too wide. In multi-mode, displays a compact summary (e.g. "3 selected") rather than listing all selected values inline.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/PickerPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/input/Picker.ts',
                    notes: 'Hoist Picker component.'
                }
            ],
            item: panel({
                title: 'Forms › Picker',
                icon: Icon.list(),
                width: '90%',
                maxWidth: 1000,
                scrollable: true,
                item: hframe(column1(), column2(), column3()),
                tbar: pickerToolbar(),
                bbar: compactToolbar()
            })
        });
    }
});

//------------------------------------------------------------------
// Toolbar demonstrating the primary use case: compact multi-select
//------------------------------------------------------------------
const pickerToolbar = hoistCmp.factory<PickerPanelModel>(({model}) =>
    toolbar(
        picker({
            bind: 'toolbarStates',
            options: usStates,
            enableMulti: true,
            enableClear: true,
            enableSelectAll: true,
            displayNoun: 'state',
            buttonProps: {icon: Icon.globe()},
            width: 200,
            testId: 'tbar-states'
        }),
        toolbarSep(),
        picker({
            bind: 'toolbarPriority',
            options: ['Critical', 'High', 'Medium', 'Low'],
            placeholder: 'Priority...',
            buttonProps: {icon: Icon.flag()},
            testId: 'tbar-priority'
        })
    )
);

//------------------------------------------------------------------
// Compact bottom toolbar
//------------------------------------------------------------------
const compactToolbar = hoistCmp.factory<PickerPanelModel>(({model}) =>
    toolbar({
        compact: true,
        items: [
            picker({
                bind: 'toolbarStates',
                options: usStates,
                compact: true,
                enableMulti: true,
                enableClear: true,
                enableSelectAll: true,
                displayNoun: 'state',
                buttonProps: {icon: Icon.globe()},
                width: 180,
                popoverPosition: 'top'
            }),
            toolbarSep(),
            picker({
                bind: 'toolbarPriority',
                options: ['Critical', 'High', 'Medium', 'Low'],
                compact: true,
                placeholder: 'Priority...',
                buttonProps: {icon: Icon.flag()},
                width: 130,
                popoverPosition: 'top'
            })
        ]
    })
);

//------------------------------------------------------------------
// Column 1: Single & multi-select basics
//------------------------------------------------------------------
const column1 = hoistCmp.factory<PickerPanelModel>(() =>
    vbox({
        flex: 1,
        padding: 20,
        items: [
            demoRow({
                label: 'Single select',
                info: 'Basic single-select with default options',
                item: picker({
                    bind: 'singleState',
                    options: usStates,
                    placeholder: 'Select a state...',
                    width: 200,
                    testId: 'single-state'
                })
            }),
            demoRow({
                label: 'Multi-select',
                info: 'enableMulti, enableClear, enableSelectAll, displayNoun',
                item: picker({
                    bind: 'multiStates',
                    options: usStates,
                    enableMulti: true,
                    enableClear: true,
                    enableSelectAll: true,
                    displayNoun: 'state',
                    width: 220,
                    testId: 'multi-states'
                })
            }),
            demoRow({
                label: 'Simple options',
                info: 'Primitive string options, enableClear',
                item: picker({
                    bind: 'simpleOption',
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
                    options: usStates,
                    disabled: true,
                    placeholder: 'Disabled...',
                    width: 200
                })
            }),
            demoRow({
                label: 'Compact',
                info: 'compact: true — standalone, outside toolbar',
                item: picker({
                    bind: 'compactStates',
                    options: usStates,
                    compact: true,
                    enableMulti: true,
                    enableClear: true,
                    displayNoun: 'state',
                    width: 200,
                    testId: 'compact-standalone'
                })
            }),
            demoRow({
                label: 'Minimal popover',
                info: 'popoverMinimal: true — no arrow or border',
                item: picker({
                    bind: 'minimalPopoverState',
                    options: usStates,
                    popoverMinimal: true,
                    placeholder: 'Minimal...',
                    width: 200
                })
            })
        ]
    })
);

//------------------------------------------------------------------
// Column 2: Advanced features
//------------------------------------------------------------------
const column2 = hoistCmp.factory<PickerPanelModel>(({model}) =>
    vbox({
        flex: 1,
        padding: 20,
        items: [
            demoRow({
                label: 'Custom fields',
                info: 'labelField + valueField on plain objects',
                item: picker({
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
                    placeholder: 'Pick a restaurant...',
                    width: 240
                })
            }),
            demoRow({
                label: 'Badge count',
                info: 'buttonTextRenderer with Hoist Badge',
                item: picker({
                    bind: 'badgeStates',
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
                    options: usStates,
                    buttonProps: {outlined: false},
                    placeholder: 'Select...',
                    width: 200
                })
            }),
            demoRow({
                label: 'Large list (virtual)',
                info: '500 options — virtualized via react-window',
                item: picker({
                    bind: 'largeListValues',
                    options: LARGE_OPTIONS,
                    enableMulti: true,
                    enableClear: true,
                    enableSelectAll: true,
                    displayNoun: 'item',
                    stripeRows: true,
                    width: 200
                })
            })
        ]
    })
);

//------------------------------------------------------------------
// Column 3: Intent variants
//------------------------------------------------------------------
const column3 = hoistCmp.factory<PickerPanelModel>(() =>
    vbox({
        flex: 1,
        padding: 20,
        items: [
            demoRow({
                label: 'Primary',
                info: 'intent: primary',
                item: picker({
                    bind: 'intentPrimary',
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
                    options: usStates,
                    buttonProps: {icon: Icon.skull(), intent: 'danger'},
                    placeholder: 'Critical...',
                    width: 180
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

const demoRow = hoistCmp.factory(({label, info, children}) =>
    vbox({
        className: 'tb-picker-panel__row',
        items: [
            span({className: 'tb-picker-panel__label', item: label}),
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
class PickerPanelModel extends HoistModel {
    @lookup(TabContainerModel) tabContainerModel: TabContainerModel;

    // Toolbar
    @bindable toolbarStates: string[] = [];
    @bindable toolbarPriority: string = null;

    // Column 1
    @bindable singleState: string = null;
    @bindable multiStates: string[] = [];
    @bindable simpleOption: string = null;
    @bindable compactStates: string[] = [];

    // Column 3 — intents
    @bindable intentPrimary: string = null;
    @bindable intentSuccess: string = null;
    @bindable intentWarning: string = null;
    @bindable intentDanger: string = null;

    // Column 2
    @bindable restaurant: string = null;
    @bindable badgeStates: string[] = [];
    @bindable statusOption: string = null;
    @bindable wideState: string[] = [];
    @bindable nonMinimalState: string = null;
    @bindable minimalPopoverState: string = null;
    @bindable largeListValues: string[] = [];

    constructor() {
        super();
        makeObservable(this);
    }
}
