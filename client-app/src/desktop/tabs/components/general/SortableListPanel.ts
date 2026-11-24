import {chip} from '@xh/hoist/cmp/chip';
import {div, filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import type {SortableListProps} from '@xh/hoist/cmp/sortablelist';
import {sortableList} from '@xh/hoist/cmp/sortablelist';
import type {HoistProps} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {
    numberInput,
    segmentedControl,
    select,
    slider,
    switchInput
} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, observableRef} from '@xh/hoist/mobx';
import {
    demoFrame,
    demoGrid,
    demoPanel,
    demoPlayground,
    demoSection,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import './SortableListPanel.scss';

interface Entry {
    id: string;
    name: string;
    meta?: string;
    pinned?: boolean;
}

const DIMS: Entry[] = [
        {id: 'region', name: 'Region', meta: 'string'},
        {id: 'sector', name: 'Sector', meta: 'string'},
        {id: 'fund', name: 'Fund', meta: 'string'},
        {id: 'trader', name: 'Trader', meta: 'string'},
        {id: 'book', name: 'Book', meta: 'string'},
        {id: 'ccy', name: 'Currency', meta: 'string'}
    ],
    TABS: Entry[] = ['Positions', 'Orders', 'Risk', 'News', 'Admin'].map(name => ({
        id: name.toLowerCase(),
        name
    })),
    WIDGETS: Entry[] = [
        'Blotter',
        'P&L chart',
        'Exposure',
        'Limits',
        'Watchlist',
        'Alerts',
        'Calendar',
        'News feed',
        'Order book',
        'Fills',
        'Greeks',
        'Scenario',
        'Notes',
        'Heatmap'
    ].map((name, i) => ({id: `w${i}`, name, meta: `widget ${i + 1}`})),
    COLUMNS: Entry[] = [
        {id: 'symbol', name: 'Symbol', meta: 'pinned', pinned: true},
        {id: 'qty', name: 'Quantity'},
        {id: 'px', name: 'Price'},
        {id: 'mv', name: 'Mkt Value'},
        {id: 'pnl', name: 'P&L', meta: 'pinned', pinned: true}
    ],
    // Dimensions the Playground's picker can add, beyond those it starts with.
    MORE_DIMS: Entry[] = [
        {id: 'strategy', name: 'Strategy', meta: 'string'},
        {id: 'account', name: 'Account', meta: 'string'},
        {id: 'country', name: 'Country', meta: 'string'},
        {id: 'assetClass', name: 'Asset class', meta: 'string'}
    ],
    STEPS: Entry[] = [
        {id: 's1', name: 'Load positions', meta: 'source'},
        {id: 's2', name: 'Filter to open', meta: 'filter'},
        {id: 's3', name: 'Group by desk', meta: 'transform'}
    ];

export const sortableListPanel = hoistCmp.factory({
    displayName: 'SortableListPanel',
    model: creates(() => SortableListPanelModel),

    render({model}) {
        return wrapper({
            title: 'Sortable List',
            icon: Icon.gripVertical(),
            description: [
                'A `SortableList` lets users reorder items by dragging or with the keyboard. You',
                'render each item; the list draws the handles, the lifted item, the drop',
                'placeholder and the screen reader announcements. It writes nothing until a',
                'reorder completes, then writes `bind` and calls `onReorder` once.',
                '',
                'Keyboard: Tab to a handle, Space to lift, arrow keys to move, Space to drop,',
                'Escape to cancel. Alt with an arrow key moves an item one place at once.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/SortableListPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/sortablelist/README.md', text: 'SortableList docs'},
                {url: '$HR/cmp/sortablelist/SortableList.ts', notes: 'Hoist component.'},
                {url: '$HR/styles/vars.scss', notes: 'CSS variables, in the Sortable Lists block.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground',
                    info: 'Drives the Playground list.',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    children: [
                        wrapperOption({
                            label: 'Sizing',
                            info: 'maxHeight fits the items, then scrolls. A fixed height keeps its size.',
                            control: segmentedControl({
                                bind: 'sizing',
                                fill: false,
                                compact: true,
                                options: [
                                    {value: 'max', label: 'maxHeight'},
                                    {value: 'fixed', label: 'height'}
                                ]
                            })
                        }),
                        wrapperOption({
                            label: 'Variant',
                            propName: 'SortableListProps.variant',
                            control: segmentedControl({
                                bind: 'variant',
                                fill: false,
                                compact: true,
                                options: ['plain', 'divided', 'spaced']
                            })
                        }),
                        wrapperOption({
                            label: 'Handle',
                            propName: 'SortableListProps.handle',
                            control: segmentedControl({
                                bind: 'handle',
                                fill: false,
                                compact: true,
                                options: ['start', 'end', 'item']
                            })
                        }),
                        wrapperOption({
                            label: 'Compact',
                            propName: 'SortableListProps.compact',
                            control: switchInput({bind: 'compact'})
                        }),
                        wrapperOption({
                            label: 'Removable',
                            propName: 'SortableListProps.removable',
                            control: switchInput({bind: 'removable'})
                        }),
                        wrapperOption({
                            label: 'Remove on hover',
                            propName: 'SortableListProps.showRemoveOnHover',
                            control: switchInput({
                                bind: 'showRemoveOnHover',
                                disabled: !model.removable
                            })
                        }),
                        wrapperOption({
                            label: 'Add row',
                            info: 'A built-in button (getNewItem), or a picker of your own (addRenderer).',
                            control: segmentedControl({
                                bind: 'addMode',
                                fill: false,
                                compact: true,
                                options: [
                                    {value: 'none', label: 'none'},
                                    {value: 'button', label: 'getNewItem'},
                                    {value: 'picker', label: 'addRenderer'}
                                ]
                            })
                        }),
                        wrapperOption({
                            label: 'Disabled',
                            propName: 'SortableListProps.disabled',
                            control: switchInput({bind: 'disabled'})
                        }),
                        wrapperOption({
                            label: 'Scroll acceleration',
                            propName: 'SortableListProps.scrollAcceleration',
                            info: 'Auto-scroll speed while dragging near an edge. Add items to make the list scroll.',
                            alignTop: true,
                            control: vbox({
                                width: 160,
                                children: [
                                    slider({
                                        bind: 'scrollAcceleration',
                                        min: 5,
                                        max: 40,
                                        stepSize: 5,
                                        labelRenderer: false
                                    }),
                                    numberInput({
                                        bind: 'scrollAcceleration',
                                        width: 80,
                                        min: 1,
                                        max: 100
                                    })
                                ]
                            })
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
                            className: 'tb-sortable-list-panel__playground',
                            value: model.dims,
                            caption:
                                'Drag a grip, or Tab to one and use the keyboard. Delete or Backspace on a grip removes its item.',
                            config: fmtDemoConfig<SortableListProps>(
                                'sortableList',
                                model.listConfig
                            ),
                            children: sortableList({
                                model,
                                bind: 'dims',
                                flex: 1,
                                ...model.sizeProps,
                                variant: model.variant,
                                handle: model.handle,
                                compact: model.compact,
                                disabled: model.disabled,
                                scrollAcceleration: model.scrollAcceleration,
                                getItemLabel: (it: Entry) => it.name,
                                itemRenderer: (it: Entry) => entryRow({entry: it}),
                                removable: model.removable,
                                showRemoveOnHover: model.showRemoveOnHover,
                                emptyText: 'No dimensions',
                                getNewItem:
                                    model.addMode === 'button' ? () => model.newDim() : null,
                                addText: 'Add dimension...',
                                addRenderer:
                                    model.addMode === 'picker'
                                        ? ({add, value}) => dimPicker({add, chosen: value})
                                        : null
                            })
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        children: demoGrid({
                            columns: 2,
                            children: [
                                demoFrame({
                                    label: 'Horizontal',
                                    info: "orientation: 'horizontal', wrap, handle: 'item', chips as items",
                                    children: div({
                                        className:
                                            'tb-sortable-list-panel__pad tb-sortable-list-panel__chips',
                                        children: sortableList({
                                            model,
                                            bind: 'tabs',
                                            orientation: 'horizontal',
                                            wrap: true,
                                            handle: 'item',
                                            getItemLabel: (it: Entry) => it.name,
                                            itemRenderer: (it: Entry) =>
                                                chip({
                                                    outlined: true,
                                                    size: 'large',
                                                    children: it.name
                                                })
                                        })
                                    })
                                }),
                                demoFrame({
                                    label: 'Scrolling',
                                    info: "height: 180, variant: 'divided' - the items scroll inside the list; drag to an edge to auto-scroll",
                                    children: div({
                                        className: 'tb-sortable-list-panel__pad',
                                        children: sortableList({
                                            model,
                                            bind: 'widgets',
                                            variant: 'divided',
                                            height: 180,
                                            getItemLabel: (it: Entry) => it.name,
                                            itemRenderer: (it: Entry) => entryRow({entry: it})
                                        })
                                    })
                                }),
                                demoFrame({
                                    label: 'Fixed items',
                                    info: "variant: 'spaced', removable - pinned columns neither move nor can be removed",
                                    children: div({
                                        className: 'tb-sortable-list-panel__pad',
                                        children: sortableList({
                                            model,
                                            bind: 'columns',
                                            variant: 'spaced',
                                            removable: true,
                                            isItemMovable: (it: Entry) => !it.pinned,
                                            isItemRemovable: (it: Entry) => !it.pinned,
                                            getItemLabel: (it: Entry) => it.name,
                                            itemRenderer: (it: Entry) => entryRow({entry: it})
                                        })
                                    })
                                }),
                                stepsEditor()
                            ]
                        })
                    })
                ]
            })
        });
    }
});

const entryRow = hoistCmp.factory<HoistProps & {entry: Entry}>({
    displayName: 'SortableEntryRow',
    model: false,
    render({entry}) {
        return hbox({
            className: 'tb-sortable-list-panel__row',
            children: [
                span({className: 'tb-sortable-list-panel__name', children: entry.name}),
                filler(),
                span({className: 'tb-sortable-list-panel__meta', children: entry.meta})
            ]
        });
    }
});

// Leaves out the dimensions already in the list. Focus stays here, ready for the next pick.
const dimPicker = hoistCmp.factory<HoistProps & {add: (e: Entry) => void; chosen: Entry[]}>({
    displayName: 'SortableDimPicker',
    model: false,
    render({add, chosen}) {
        const options = [...DIMS, ...MORE_DIMS]
            .filter(d => !chosen.some(it => it.id === d.id))
            .map(d => ({value: d.id, label: d.name}));
        return select({
            // A new key on each add clears the typed text. The list refocuses it after the add.
            key: options.length,
            className: 'tb-sortable-list-panel__dim-picker',
            options,
            placeholder: options.length ? 'Add dimension...' : 'All dimensions added',
            disabled: !options.length,
            leftIcon: Icon.add(),
            flex: 1,
            width: null,
            enableFilter: true,
            hideDropdownIndicator: true,
            hideSelectedOptionCheck: true,
            onChange: id => add([...DIMS, ...MORE_DIMS].find(d => d.id === id))
        });
    }
});

const stepsEditor = hoistCmp.factory<SortableListPanelModel>({
    displayName: 'SortableStepsEditor',
    render({model}) {
        return demoFrame({
            label: 'Detail rows',
            info: "detailRenderer, variant: 'divided', compact, handle at end - click a row or its chevron",
            children: div({
                className: 'tb-sortable-list-panel__pad',
                children: sortableList({
                    model,
                    bind: 'steps',
                    variant: 'divided',
                    compact: true,
                    handle: 'end',
                    getItemLabel: (it: Entry) => it.name,
                    itemRenderer: (it: Entry) => entryRow({entry: it}),
                    detailRenderer: (it: Entry) =>
                        div({
                            className: 'tb-sortable-list-panel__detail',
                            children: `Settings for "${it.name}" - this slot spans the list's width.`
                        })
                })
            })
        });
    }
});

class SortableListPanelModel extends HoistModel {
    @bindable accessor variant: SortableListProps['variant'] = 'divided';
    @bindable accessor handle: SortableListProps['handle'] = 'start';
    @bindable accessor compact = false;
    @bindable accessor disabled = false;
    @bindable accessor scrollAcceleration = 15;
    @bindable accessor sizing: 'max' | 'fixed' = 'max';
    @bindable accessor removable = true;
    @bindable accessor addMode: 'none' | 'button' | 'picker' = 'picker';
    @bindable accessor showRemoveOnHover = false;

    /** Height props for the Playground list - sized to fit the Playground band. */
    get sizeProps() {
        return this.sizing === 'max' ? {maxHeight: 230} : {height: 230};
    }

    @observableRef accessor dims: Entry[] = DIMS;
    @observableRef accessor tabs: Entry[] = TABS;
    @observableRef accessor widgets: Entry[] = WIDGETS;
    @observableRef accessor columns: Entry[] = COLUMNS;
    @observableRef accessor steps: Entry[] = STEPS;

    @action setDims(v: Entry[]) {
        this.dims = v;
    }

    @action setTabs(v: Entry[]) {
        this.tabs = v;
    }

    @action setWidgets(v: Entry[]) {
        this.widgets = v;
    }

    @action setColumns(v: Entry[]) {
        this.columns = v;
    }

    @action setSteps(v: Entry[]) {
        this.steps = v;
    }

    /** The data for a new item - the list adds it through `bind`. */
    newDim(): Entry {
        const n = this.dims.length + 1;
        return {id: `d${Date.now()}`, name: `Dimension ${n}`, meta: 'string'};
    }

    get listConfig() {
        const {variant, handle, compact, disabled, scrollAcceleration, removable, addMode} = this,
            {showRemoveOnHover} = this;
        return {
            bind: 'dims',
            ...this.sizeProps,
            variant: variant !== 'plain' ? variant : undefined,
            handle: handle !== 'start' ? handle : undefined,
            compact: compact || undefined,
            disabled: disabled || undefined,
            scrollAcceleration: scrollAcceleration !== 15 ? scrollAcceleration : undefined,
            getItemLabel: raw('it => it.name'),
            itemRenderer: raw('it => entryRow({entry: it})'),
            removable: removable || undefined,
            showRemoveOnHover: (removable && showRemoveOnHover) || undefined,
            emptyText: 'No dimensions',
            getNewItem: addMode === 'button' ? raw('() => model.newDim()') : undefined,
            addText: addMode === 'button' ? 'Add dimension...' : undefined,
            addRenderer:
                addMode === 'picker'
                    ? raw('({add, value}) => dimPicker({add, chosen: value})')
                    : undefined
        };
    }
}
