import {badge} from '@xh/hoist/cmp/badge';
import type {ItemListEntry, ItemListProps} from '@xh/hoist/cmp/itemlist';
import {itemList} from '@xh/hoist/cmp/itemlist';
import type {LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {fmtMillions} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, observableRef, runInAction} from '@xh/hoist/mobx';
import {groupBy, map, orderBy, sumBy, take} from 'lodash';
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
import './ItemListPanel.scss';

/** Open alerts, as an app would list them. */
const ALERTS: ItemListEntry[] = [
    {
        title: 'Margin call on the Winter Star fund',
        description: 'Collateral fell below the required level. Post 1.2m by end of day.',
        icon: Icon.warning(),
        intent: 'danger',
        detail: '2 min ago'
    },
    {
        title: 'Trade 48211 awaits approval',
        description: 'A block trade above the desk limit.',
        icon: Icon.clock(),
        intent: 'warning',
        detail: badge({item: 'Pending', intent: 'warning'})
    },
    {
        title: 'Prices loaded',
        icon: Icon.checkCircle(),
        intent: 'success',
        detail: '09:30'
    },
    {
        title: 'Report archive is read-only today',
        description: 'The archive moves to new storage. Reports from before 2024 open tomorrow.',
        icon: Icon.info(),
        detail: 'All day'
    }
];

export const itemListPanel = hoistCmp.factory({
    displayName: 'ItemListPanel',
    model: creates(() => ItemListPanelModel),

    render({model}) {
        const {listProps, playgroundEntries, clickable, topFunds} = model;
        return wrapper({
            title: 'ItemList',
            icon: Icon.list(),
            description: [
                'An `ItemList` is a short, static list of entries, each with a title and an',
                'optional description, leading icon and trailing detail: a handful of alerts,',
                'recent activity, the results of a search.',
                '',
                'The list is presentation-only. It takes a plain array, with no model and no',
                'Store, and renders every entry. Use a `DataView` for a long list, or for',
                'selection, sorting and grouping.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/ItemListPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/README.md#itemlist-itemlist',
                    text: 'ItemList docs',
                    notes: 'Props, and when to use a DataView.'
                },
                {url: '$HR/cmp/itemlist/ItemList.ts', notes: 'Hoist component.'},
                {url: '$HR/cmp/itemlist/ItemList.scss', notes: 'Styles and CSS variables.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground',
                    info: 'Drives the Playground list.',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    items: [
                        wrapperOption({
                            label: 'Ordered',
                            propName: 'ItemListProps.ordered',
                            info: 'Numbers replace the icons.',
                            control: switchInput({bind: 'ordered'})
                        }),
                        wrapperOption({
                            label: 'Dividers',
                            propName: 'ItemListProps.dividers',
                            control: switchInput({bind: 'dividers'})
                        }),
                        wrapperOption({
                            label: 'Size',
                            propName: 'ItemListProps.size',
                            control: select({
                                bind: 'size',
                                enableFilter: false,
                                enableClear: true,
                                width: 120,
                                options: ['standard', 'compact']
                            })
                        }),
                        wrapperOption({
                            label: 'Clickable',
                            propName: 'ItemListProps.onEntryClick',
                            control: switchInput({bind: 'clickable'})
                        }),
                        wrapperOption({
                            label: 'Icons',
                            propName: 'ItemListEntry.icon',
                            control: switchInput({bind: 'showIcons'})
                        }),
                        wrapperOption({
                            label: 'Descriptions',
                            propName: 'ItemListEntry.description',
                            control: switchInput({bind: 'showDescriptions'})
                        }),
                        wrapperOption({
                            label: 'Details',
                            propName: 'ItemListEntry.detail',
                            control: switchInput({bind: 'showDetails'})
                        }),
                        wrapperOption({
                            label: 'Intents',
                            propName: 'ItemListEntry.intent',
                            control: switchInput({bind: 'showIntents'})
                        }),
                        wrapperOption({
                            label: 'Empty',
                            propName: 'ItemListProps.emptyText',
                            info: 'No entries, to show emptyText.',
                            control: switchInput({bind: 'empty'})
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
                            instanceWidth: 440,
                            showValue: false,
                            caption: 'Four alerts in a 440px box.',
                            config: fmtDemoConfig<ItemListProps>('itemList', {
                                entries: raw('alerts'),
                                ...listProps,
                                emptyText: 'No open alerts',
                                onEntryClick: clickable
                                    ? raw('(entry, index) => model.openAlert(alerts[index])')
                                    : undefined
                            }),
                            item: itemList({
                                entries: playgroundEntries,
                                ...listProps,
                                emptyText: 'No open alerts',
                                onEntryClick: clickable
                                    ? ({title}) => XH.toast({message: `Clicked: ${title}`})
                                    : null
                            })
                        })
                    }),
                    demoSection({
                        title: 'Ranking',
                        note: 'ordered numbers the entries. The five largest funds by market value.',
                        item: demoGrid({
                            columns: 2,
                            items: [
                                demoFrame({
                                    label: 'ordered',
                                    item: itemList({ordered: true, entries: topFunds})
                                }),
                                demoFrame({
                                    label: 'ordered, compact, dividers',
                                    info: 'An intent colors the number',
                                    item: itemList({
                                        ordered: true,
                                        size: 'compact',
                                        dividers: true,
                                        entries: topFunds.map((it, idx) => ({
                                            ...it,
                                            intent: idx === 0 ? 'success' : null
                                        }))
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Markers',
                        note: 'Icons, an intent bar where no entry has an icon, and plain text.',
                        item: demoGrid({
                            items: [
                                demoFrame({
                                    label: 'Icons and intents',
                                    item: itemList({entries: ALERTS.map(withoutText)})
                                }),
                                demoFrame({
                                    label: 'Intents, no icons',
                                    info: 'A thin colored bar',
                                    item: itemList({
                                        entries: ALERTS.map(it => ({
                                            ...withoutText(it),
                                            icon: null
                                        }))
                                    })
                                }),
                                demoFrame({
                                    label: 'Titles only',
                                    item: itemList({
                                        entries: ALERTS.map(({title}) => ({title}))
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Clickable',
                        note: 'onEntryClick makes each entry a button. A disabled entry is left out.',
                        item: demoFrame({
                            className: 'tb-item-list-panel__narrow',
                            item: itemList({
                                dividers: true,
                                onEntryClick: ({title}, idx) =>
                                    XH.toast({message: `Entry ${idx}: ${title}`}),
                                entries: [
                                    {
                                        title: 'Daily P&L report',
                                        description: 'P&L by fund and by trader.',
                                        icon: Icon.chartLine(),
                                        detail: Icon.arrowRight()
                                    },
                                    {
                                        title: 'Exposure report',
                                        description: 'Gross and net exposure by sector.',
                                        icon: Icon.chartBar(),
                                        detail: Icon.arrowRight()
                                    },
                                    {
                                        title: 'Audit report',
                                        description: 'Open to the compliance team only.',
                                        icon: Icon.shield(),
                                        disabled: true
                                    }
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Narrow and Long Text',
                        note: 'At 240px. Titles and descriptions wrap beside the detail.',
                        item: demoGrid({
                            columns: 2,
                            items: [
                                demoFrame({
                                    className: 'tb-item-list-panel__slim',
                                    item: itemList({entries: ALERTS, dividers: true})
                                }),
                                demoFrame({
                                    className: 'tb-item-list-panel__slim',
                                    item: itemList({
                                        ordered: true,
                                        entries: [
                                            {
                                                title: 'ORD-2026-11-14-000000000000000000487213',
                                                detail: 'Filled'
                                            },
                                            {
                                                title: 'A title of several words that wraps onto more than one line',
                                                description: 'With a description that also wraps.',
                                                detail: badge('New')
                                            },
                                            {title: 'Short', detail: '1,204,330.25'}
                                        ]
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Empty',
                        note: 'emptyText shows in place of a list with no entries.',
                        item: demoGrid({
                            columns: 2,
                            items: [
                                demoFrame({
                                    label: 'No entries',
                                    item: itemList({entries: [], emptyText: 'No open alerts'})
                                }),
                                demoFrame({
                                    label: 'Every entry omitted',
                                    item: itemList({
                                        entries: [{title: 'Hidden', omit: true}, null],
                                        emptyText: 'Nothing to show'
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Restyled with CSS Variables',
                        note: 'Wide spacing, a bold title and a wide intent bar.',
                        item: demoFrame({
                            className: 'tb-item-list-panel__restyled tb-item-list-panel__narrow',
                            item: itemList({
                                entries: ALERTS.map(it => ({...it, icon: null}))
                            })
                        })
                    })
                ]
            })
        });
    }
});

function withoutText({title, icon, intent}: ItemListEntry): ItemListEntry {
    return {title, icon, intent};
}

class ItemListPanelModel extends HoistModel {
    @bindable accessor ordered = false;
    @bindable accessor dividers = true;
    @bindable accessor size: ItemListProps['size'] = null;
    @bindable accessor clickable = false;
    @bindable accessor showIcons = true;
    @bindable accessor showDescriptions = true;
    @bindable accessor showDetails = true;
    @bindable accessor showIntents = true;
    @bindable accessor empty = false;

    @observableRef accessor topFunds: ItemListEntry[] = [];

    /**
     * Props for the Playground list, less its entries. Options left off resolve to undefined, so
     * the snippet omits them. The snippet reads this same getter, so the code shown cannot drift
     * from the list beside it.
     */
    get listProps(): PlaygroundListProps {
        const {ordered, dividers, size} = this;
        return {
            ordered: ordered || undefined,
            dividers: dividers || undefined,
            size: size ?? undefined
        };
    }

    /** The alerts as the rail sets them. */
    get playgroundEntries(): ItemListEntry[] {
        const {empty, showIcons, showDescriptions, showDetails, showIntents} = this;
        if (empty) return [];
        return ALERTS.map(({title, description, icon, intent, detail}) => ({
            title,
            description: showDescriptions ? description : undefined,
            icon: showIcons ? icon : undefined,
            intent: showIntents ? intent : undefined,
            detail: showDetails ? detail : undefined
        }));
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const positions = await XH.portfolioService.getPricedRawPositionsAsync({loadSpec}),
            funds = map(groupBy(positions, 'fund'), (rows, fund) => ({
                fund,
                positions: rows.length,
                mktVal: sumBy(rows, it => Math.abs(it.mktVal))
            }));
        runInAction(() => {
            this.topFunds = take(orderBy(funds, 'mktVal', 'desc'), 5).map(it => ({
                title: it.fund,
                description: `${it.positions} positions`,
                detail: fmtMillions(it.mktVal, {precision: 1, label: true})
            }));
        });
    }
}

/** The ItemList props the rail drives, as the plain values its inputs produce. */
interface PlaygroundListProps {
    ordered?: boolean;
    dividers?: boolean;
    size?: ItemListProps['size'];
}
