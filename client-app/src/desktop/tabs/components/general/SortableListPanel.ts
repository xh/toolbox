import {chip} from '@xh/hoist/cmp/chip';
import {div, filler, hbox, span} from '@xh/hoist/cmp/layout';
import type {SortableListProps, SortableReorderEvent} from '@xh/hoist/cmp/sortablelist';
import {sortableList} from '@xh/hoist/cmp/sortablelist';
import type {HoistProps} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {segmentedControl, switchInput} from '@xh/hoist/desktop/cmp/input';
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
                            label: 'Disabled',
                            propName: 'SortableListProps.disabled',
                            control: switchInput({bind: 'disabled'})
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
                            value: model.lastEvent,
                            caption: 'Drag a grip, or Tab to one and use the keyboard.',
                            config: fmtDemoConfig<SortableListProps>(
                                'sortableList',
                                model.listConfig
                            ),
                            children: div({
                                className: 'tb-sortable-list-panel__box',
                                children: sortableList({
                                    model,
                                    bind: 'dims',
                                    handle: model.handle,
                                    compact: model.compact,
                                    disabled: model.disabled,
                                    getItemLabel: (it: Entry) => it.name,
                                    onReorder: e => model.logReorder(e),
                                    renderItem: (it: Entry) => entryRow({entry: it})
                                })
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
                                    info: "orientation: 'horizontal', handle: 'item', chips as items",
                                    children: div({
                                        className: 'tb-sortable-list-panel__pad',
                                        children: sortableList({
                                            model,
                                            bind: 'tabs',
                                            orientation: 'horizontal',
                                            handle: 'item',
                                            getItemLabel: (it: Entry) => it.name,
                                            renderItem: (it: Entry) =>
                                                chip({
                                                    outlined: true,
                                                    size: 'large',
                                                    children: it.name
                                                })
                                        })
                                    })
                                }),
                                demoFrame({
                                    label: 'Nested scroll',
                                    info: 'Drag to an edge to auto-scroll the box',
                                    children: div({
                                        className: 'tb-sortable-list-panel__scroll',
                                        children: sortableList({
                                            model,
                                            bind: 'widgets',
                                            getItemLabel: (it: Entry) => it.name,
                                            renderItem: (it: Entry) => entryRow({entry: it})
                                        })
                                    })
                                }),
                                demoFrame({
                                    label: 'Disabled items',
                                    info: 'isItemDisabled - pinned columns stay put',
                                    children: div({
                                        className: 'tb-sortable-list-panel__box',
                                        children: sortableList({
                                            model,
                                            bind: 'columns',
                                            isItemDisabled: (it: Entry) => it.pinned,
                                            getItemLabel: (it: Entry) => it.name,
                                            renderItem: (it: Entry) => entryRow({entry: it})
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

/** The Blueprints Inspector pattern: compact rows, trailing actions, one detail, an Add row. */
const stepsEditor = hoistCmp.factory<SortableListPanelModel>({
    displayName: 'SortableStepsEditor',
    render({model}) {
        return demoFrame({
            label: 'Detail rows',
            info: 'compact, handle at end, expandable rows - click a row or its chevron - and an Add row',
            children: div({
                className: 'tb-sortable-list-panel__box',
                children: [
                    sortableList({
                        model,
                        bind: 'steps',
                        compact: true,
                        handle: 'end',
                        getItemLabel: (it: Entry) => it.name,
                        renderItem: (it: Entry) =>
                            hbox({
                                className: 'tb-sortable-list-panel__row',
                                children: [
                                    span({
                                        className: 'tb-sortable-list-panel__name',
                                        children: it.name
                                    }),
                                    span({
                                        className: 'tb-sortable-list-panel__meta',
                                        children: it.meta
                                    }),
                                    filler(),
                                    button({
                                        icon: Icon.delete(),
                                        intent: 'danger',
                                        minimal: true,
                                        small: true,
                                        title: 'Remove',
                                        onClick: () => model.removeStep(it.id)
                                    })
                                ]
                            }),
                        renderDetail: (it: Entry) =>
                            div({
                                className: 'tb-sortable-list-panel__detail',
                                children: `Settings for "${it.name}" - this slot spans the list's width.`
                            })
                    }),
                    button({
                        className: 'tb-sortable-list-panel__add',
                        icon: Icon.add(),
                        text: 'Add step...',
                        minimal: true,
                        onClick: () => model.addStep()
                    })
                ]
            })
        });
    }
});

class SortableListPanelModel extends HoistModel {
    @bindable accessor handle: SortableListProps['handle'] = 'start';
    @bindable accessor compact = false;
    @bindable accessor disabled = false;
    @bindable accessor lastEvent: object = null;

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

    @action
    logReorder(e: SortableReorderEvent<Entry>) {
        this.lastEvent = {
            item: e.item.id,
            fromIndex: e.fromIndex,
            toIndex: e.toIndex,
            source: e.source,
            items: e.items.map(it => it.id)
        };
    }

    @action
    removeStep(id: string) {
        this.steps = this.steps.filter(it => it.id !== id);
    }

    @action
    addStep() {
        const n = this.steps.length + 1;
        this.steps = [...this.steps, {id: `s${Date.now()}`, name: `Step ${n}`, meta: 'new'}];
    }

    get listConfig() {
        const {handle, compact, disabled} = this;
        return {
            bind: 'dims',
            handle: handle !== 'start' ? handle : undefined,
            compact: compact || undefined,
            disabled: disabled || undefined,
            getItemLabel: raw('it => it.name'),
            onReorder: raw('e => model.logReorder(e)'),
            renderItem: raw('it => entryRow({entry: it})')
        };
    }
}
