import {badge} from '@xh/hoist/cmp/badge';
import {code, div, filler, hbox, hframe, p, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {popoverPicker} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {usStates} from '../../../core/data';
import {wrapper} from '../../common';
import './PopoverPickerPanel.scss';

const STATUS_OPTIONS = [
    {label: 'Active', value: 'active', color: 'var(--xh-green)'},
    {label: 'Pending', value: 'pending', color: 'var(--xh-orange)'},
    {label: 'Inactive', value: 'inactive', color: 'var(--xh-red)'},
    {label: 'Archived', value: 'archived', color: 'var(--xh-text-color-muted)'}
];

export const popoverPickerPanel = hoistCmp.factory({
    model: creates(() => PopoverPickerPanelModel),

    render() {
        return wrapper({
            description: [
                p(
                    code('PopoverPicker'),
                    ' presents its options in a popover dropdown triggered by a compact button showing the current value or a summary. Supports single and multi-select modes.'
                ),
                p(
                    'Designed for space-constrained areas such as toolbars, where a traditional ',
                    code('Select'),
                    ' component — especially in multi-select "tag picker" mode — is too wide. In multi-mode, displays a compact summary (e.g. "3 selected") rather than listing all selected values inline.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/forms/PopoverPickerPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/input/PopoverPicker.ts',
                    notes: 'Hoist PopoverPicker component.'
                }
            ],
            item: panel({
                title: 'Forms › PopoverPicker',
                icon: Icon.list(),
                width: '90%',
                height: 700,
                scrollable: true,
                item: hframe(column1(), column2()),
                tbar: pickerToolbar(),
                bbar: compactToolbar()
            })
        });
    }
});

//------------------------------------------------------------------
// Toolbar demonstrating the primary use case: compact multi-select
//------------------------------------------------------------------
const pickerToolbar = hoistCmp.factory<PopoverPickerPanelModel>(({model}) =>
    toolbar(
        span('Toolbar usage:'),
        popoverPicker({
            bind: 'toolbarStates',
            options: usStates,
            enableMulti: true,
            enableClear: true,
            buttonProps: {icon: Icon.globe()},
            placeholder: 'States...',
            width: 200
        }),
        toolbarSep(),
        popoverPicker({
            bind: 'toolbarPriority',
            options: ['Critical', 'High', 'Medium', 'Low'],
            placeholder: 'Priority...',
            buttonProps: {icon: Icon.flag()}
        }),
        filler(),
        div({
            className: 'xh-text-color-muted',
            item: 'PopoverPicker is ideal for toolbar-based filtering'
        })
    )
);

//------------------------------------------------------------------
// Compact bottom toolbar
//------------------------------------------------------------------
const compactToolbar = hoistCmp.factory<PopoverPickerPanelModel>(({model}) =>
    toolbar({
        compact: true,
        items: [
            span('Compact toolbar:'),
            popoverPicker({
                bind: 'toolbarStates',
                options: usStates,
                enableMulti: true,
                enableClear: true,
                buttonProps: {icon: Icon.globe()},
                placeholder: 'States...',
                width: 180
            }),
            toolbarSep(),
            popoverPicker({
                bind: 'toolbarPriority',
                options: ['Critical', 'High', 'Medium', 'Low'],
                placeholder: 'Priority...',
                buttonProps: {icon: Icon.flag()},
                width: 130
            }),
            filler(),
            div({
                className: 'xh-text-color-muted',
                item: 'Same pickers in compact mode'
            })
        ]
    })
);

//------------------------------------------------------------------
// Column 1: Single & multi-select basics
//------------------------------------------------------------------
const column1 = hoistCmp.factory<PopoverPickerPanelModel>(() =>
    vbox({
        flex: 1,
        padding: 20,
        items: [
            demoRow({
                label: 'Single select',
                info: 'Basic single-select with default options',
                item: popoverPicker({
                    bind: 'singleState',
                    options: usStates,
                    placeholder: 'Select a state...',
                    width: 200
                })
            }),
            demoRow({
                label: 'Multi-select',
                info: 'enableMulti, enableClear',
                item: popoverPicker({
                    bind: 'multiStates',
                    options: usStates,
                    enableMulti: true,
                    enableClear: true,
                    placeholder: 'Select states...',
                    width: 220
                })
            }),
            demoRow({
                label: 'With icon + intent',
                info: 'buttonProps: {icon, intent}',
                item: popoverPicker({
                    bind: 'intentState',
                    options: usStates,
                    buttonProps: {icon: Icon.globe(), intent: 'primary'},
                    placeholder: 'Region...',
                    width: 180
                })
            }),
            demoRow({
                label: 'Simple options',
                info: 'Primitive string options, no filter needed',
                item: popoverPicker({
                    bind: 'simpleOption',
                    options: ['Small', 'Medium', 'Large', 'X-Large'],
                    enableFilter: false,
                    placeholder: 'Size...',
                    width: 140
                })
            }),
            demoRow({
                label: 'Disabled',
                info: 'disabled: true',
                item: popoverPicker({
                    bind: 'singleState',
                    options: usStates,
                    disabled: true,
                    placeholder: 'Disabled...',
                    width: 200
                })
            })
        ]
    })
);

//------------------------------------------------------------------
// Column 2: Advanced features
//------------------------------------------------------------------
const column2 = hoistCmp.factory<PopoverPickerPanelModel>(({model}) =>
    vbox({
        flex: 1,
        padding: 20,
        items: [
            demoRow({
                label: 'Custom fields',
                info: 'labelField + valueField on plain objects',
                item: popoverPicker({
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
                info: 'textRenderer with Hoist Badge',
                item: popoverPicker({
                    bind: 'badgeStates',
                    options: usStates,
                    enableMulti: true,
                    enableClear: true,
                    buttonProps: {icon: Icon.filter()},
                    width: 180,
                    placeholder: 'Filters...',
                    textRenderer: selected => {
                        if (!selected.length) return 'Filters...';
                        return hbox({
                            alignItems: 'center',
                            items: [
                                span('Filters'),
                                badge({
                                    compact: true,
                                    intent: 'primary',
                                    className: 'tb-popover-picker-panel__badge',
                                    item: selected.length
                                })
                            ]
                        });
                    }
                })
            }),
            demoRow({
                label: 'Custom option + text renderer',
                info: 'Status dot in both options and trigger button',
                item: popoverPicker({
                    bind: 'statusOption',
                    options: STATUS_OPTIONS,
                    placeholder: 'Status...',
                    enableFilter: false,
                    width: 160,
                    textRenderer: selected => {
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
                            items: [
                                statusDot((opt as any).color),
                                span(opt.label),
                                filler(),
                                isSelected ? Icon.check({className: 'xh-intent-primary'}) : null
                            ]
                        })
                })
            }),
            demoRow({
                label: 'Popover width + stripes',
                info: 'popoverWidth, stripeRows, rowBorders',
                item: popoverPicker({
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
                item: popoverPicker({
                    bind: 'nonMinimalState',
                    options: usStates,
                    buttonProps: {outlined: false},
                    placeholder: 'Select...',
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

const demoRow = hoistCmp.factory(({label, info, children}) =>
    vbox({
        className: 'tb-popover-picker-panel__row',
        items: [
            span({className: 'tb-popover-picker-panel__label', item: label}),
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
class PopoverPickerPanelModel extends HoistModel {
    // Toolbar
    @bindable toolbarStates: string[] = [];
    @bindable toolbarPriority: string = null;

    // Column 1
    @bindable singleState: string = null;
    @bindable multiStates: string[] = [];
    @bindable intentState: string = null;
    @bindable simpleOption: string = null;

    // Column 2
    @bindable restaurant: string = null;
    @bindable badgeStates: string[] = [];
    @bindable statusOption: string = null;
    @bindable wideState: string[] = [];
    @bindable nonMinimalState: string = null;

    constructor() {
        super();
        makeObservable(this);
    }
}
