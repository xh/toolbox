import {div, filler, hbox, hframe, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {popoverPicker} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import React from 'react';
import {usStates, restaurants} from '../../../core/data';
import {wrapper} from '../../common';
import './PopoverPickerPanel.scss';

export const popoverPickerPanel = hoistCmp.factory({
    model: creates(() => PopoverPickerPanelModel),

    render() {
        return wrapper({
            description: [
                <p>
                    <code>PopoverPicker</code> presents its options in a popover dropdown triggered
                    by a compact button showing the current value or a summary. Supports single and
                    multi-select modes.
                </p>,
                <p>
                    Designed for space-constrained areas such as toolbars, where a traditional{' '}
                    <code>Select</code> component — especially in multi-select "tag picker" mode —
                    is too wide. In multi-mode, displays a compact summary (e.g. "3 of 10 selected")
                    rather than listing all selected values inline.
                </p>
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
                item: hframe(
                    column1(),
                    column2()
                ),
                tbar: pickerToolbar()
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
            emptyValue: [],
            icon: Icon.globe(),
            placeholder: 'States...',
            width: 200
        }),
        toolbarSep(),
        popoverPicker({
            bind: 'toolbarPriority',
            options: ['Critical', 'High', 'Medium', 'Low'],
            placeholder: 'Priority...',
            icon: Icon.flag(),
            width: 140
        }),
        filler(),
        div({
            className: 'xh-text-color-muted',
            item: 'PopoverPicker is ideal for toolbar-based filtering'
        })
    )
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
                info: 'enableMulti, enableClear, emptyValue: []',
                item: popoverPicker({
                    bind: 'multiStates',
                    options: usStates,
                    enableMulti: true,
                    enableClear: true,
                    emptyValue: [],
                    placeholder: 'Select states...',
                    width: 220
                })
            }),
            demoRow({
                label: 'With icon + intent',
                info: 'icon, intent, outlined',
                item: popoverPicker({
                    bind: 'intentState',
                    options: usStates,
                    icon: Icon.globe(),
                    intent: 'primary',
                    outlined: true,
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
                info: 'labelField: "name", valueField: "name"',
                item: popoverPicker({
                    bind: 'restaurant',
                    options: restaurants,
                    labelField: 'name',
                    valueField: 'name',
                    placeholder: 'Pick a restaurant...',
                    width: 240
                })
            }),
            demoRow({
                label: 'Custom button renderer',
                info: 'buttonRenderer showing selection count as badge',
                item: popoverPicker({
                    bind: 'badgeStates',
                    options: usStates,
                    enableMulti: true,
                    enableClear: true,
                    emptyValue: [],
                    icon: Icon.filter(),
                    width: 180,
                    placeholder: 'Filters...',
                    buttonRenderer: (selected, all) => {
                        if (!selected.length) return 'No filters';
                        if (selected.length === all.length) return 'All regions';
                        return `${selected.length} filter${selected.length > 1 ? 's' : ''} active`;
                    }
                })
            }),
            demoRow({
                label: 'Custom option renderer',
                info: 'optionRenderer with colored indicators',
                item: popoverPicker({
                    bind: 'statusOption',
                    options: [
                        {label: 'Active', value: 'active', color: 'var(--xh-green)'},
                        {label: 'Pending', value: 'pending', color: 'var(--xh-orange)'},
                        {label: 'Inactive', value: 'inactive', color: 'var(--xh-red)'},
                        {label: 'Archived', value: 'archived', color: 'var(--xh-text-color-muted)'}
                    ],
                    placeholder: 'Status...',
                    enableFilter: false,
                    width: 160,
                    optionRenderer: (opt, isSelected) =>
                        hbox({
                            alignItems: 'center',
                            items: [
                                div({
                                    style: {
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: (opt as any).color,
                                        marginRight: 8
                                    }
                                }),
                                span(opt.label),
                                filler(),
                                isSelected ? Icon.check({className: 'xh-blue'}) : null
                            ]
                        })
                })
            }),
            demoRow({
                label: 'Popover width',
                info: 'popoverWidth: 300, maxMenuHeight: 200',
                item: popoverPicker({
                    bind: 'wideState',
                    options: usStates,
                    enableMulti: true,
                    enableClear: true,
                    emptyValue: [],
                    popoverWidth: 300,
                    maxMenuHeight: 200,
                    placeholder: 'Wide popover...',
                    width: 200
                })
            }),
            demoRow({
                label: 'Minimal: false',
                info: 'Non-minimal trigger button style',
                item: popoverPicker({
                    bind: 'nonMinimalState',
                    options: usStates,
                    minimal: false,
                    placeholder: 'Select...',
                    width: 200
                })
            })
        ]
    })
);

//------------------------------------------------------------------
// Helper: labeled demo row
//------------------------------------------------------------------
const demoRow = hoistCmp.factory(({label, info, children}) =>
    vbox({
        className: 'tb-popover-picker-panel__row',
        items: [
            hbox({
                alignItems: 'baseline',
                items: [
                    span({className: 'tb-popover-picker-panel__label', item: label}),
                    span({
                        className: 'xh-text-color-muted xh-font-size-small',
                        style: {marginLeft: 8},
                        item: info
                    })
                ]
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
