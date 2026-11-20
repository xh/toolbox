import {badge} from '@xh/hoist/cmp/badge';
import type {ListDisplayEntry, ListDisplayProps} from '@xh/hoist/cmp/listdisplay';
import {listDisplay} from '@xh/hoist/cmp/listdisplay';
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
import './ListDisplayPanel.scss';

/** Open alerts, as an app would list them. */
const ALERTS: ListDisplayEntry[] = [
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
        detail: badge({children: 'Pending', intent: 'warning'})
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

export const listDisplayPanel = hoistCmp.factory({
    displayName: 'ListDisplayPanel',
    model: creates(() => ListDisplayPanelModel),

    render({model}) {
        const {listProps, playgroundEntries, playgroundEntriesCode, topFunds} = model;
        return wrapper({
            title: 'ListDisplay',
            icon: Icon.list(),
            description: [
                'A `ListDisplay` shows a short, static list of entries. Each entry has a title, and',
                'can add a description, a leading icon and a trailing detail. Use it for a few',
                'alerts, recent activity or search results.',
                '',
                'The list is presentation-only. It takes a plain array, with no model and no',
                'Store, and renders every entry. Use a `DataView` for a long list, or for',
                'selection, sorting and grouping.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/ListDisplayPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/README.md#listdisplay-listdisplay',
                    text: 'ListDisplay docs',
                    notes: 'Props, and when to use a DataView.'
                },
                {url: '$HR/cmp/listdisplay/ListDisplay.ts', notes: 'Hoist component.'},
                {url: '$HR/cmp/listdisplay/ListDisplay.scss', notes: 'Styles and CSS variables.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground',
                    info: 'Drives the Playground list.',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    children: [
                        wrapperOption({
                            label: 'Numbered',
                            propName: 'ListDisplayProps.numbered',
                            info: 'Numbers replace the icons.',
                            control: switchInput({bind: 'numbered'})
                        }),
                        wrapperOption({
                            label: 'Dividers',
                            propName: 'ListDisplayProps.dividers',
                            control: switchInput({bind: 'dividers'})
                        }),
                        wrapperOption({
                            label: 'Size',
                            propName: 'ListDisplayProps.size',
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
                            propName: 'ListDisplayEntry.onClick',
                            control: switchInput({bind: 'clickable'})
                        }),
                        wrapperOption({
                            label: 'Icons',
                            propName: 'ListDisplayEntry.icon',
                            control: switchInput({bind: 'showIcons'})
                        }),
                        wrapperOption({
                            label: 'Descriptions',
                            propName: 'ListDisplayEntry.description',
                            control: switchInput({bind: 'showDescriptions'})
                        }),
                        wrapperOption({
                            label: 'Details',
                            propName: 'ListDisplayEntry.detail',
                            control: switchInput({bind: 'showDetails'})
                        }),
                        wrapperOption({
                            label: 'Intents',
                            propName: 'ListDisplayEntry.intent',
                            control: switchInput({bind: 'showIntents'})
                        }),
                        wrapperOption({
                            label: 'Empty',
                            propName: 'ListDisplayProps.emptyText',
                            info: 'No entries, to show emptyText.',
                            control: switchInput({bind: 'empty'})
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
                            instanceWidth: 440,
                            showValue: false,
                            caption: 'Four alerts in a 440px box.',
                            config: fmtDemoConfig<ListDisplayProps>('listDisplay', {
                                entries: raw(playgroundEntriesCode),
                                ...listProps,
                                emptyText: 'No open alerts'
                            }),
                            children: listDisplay({
                                entries: playgroundEntries,
                                ...listProps,
                                emptyText: 'No open alerts'
                            })
                        })
                    }),
                    demoSection({
                        title: 'Ranking',
                        note: 'numbered puts a number on each entry. The five largest funds by market value.',
                        children: demoGrid({
                            columns: 2,
                            children: [
                                demoFrame({
                                    label: 'numbered',
                                    children: listDisplay({numbered: true, entries: topFunds})
                                }),
                                demoFrame({
                                    label: 'numbered, compact, dividers',
                                    info: 'An intent colors the number',
                                    children: listDisplay({
                                        numbered: true,
                                        size: 'compact',
                                        dividers: true,
                                        entries: topFunds.map((it, idx) => ({
                                            ...it,
                                            intent: idx === 0 ? ('success' as const) : null
                                        }))
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Markers',
                        note: 'Icons, an intent bar where no entry has an icon, and plain text.',
                        children: demoGrid({
                            children: [
                                demoFrame({
                                    label: 'Icons and intents',
                                    children: listDisplay({entries: ALERTS.map(withoutText)})
                                }),
                                demoFrame({
                                    label: 'Intents, no icons',
                                    info: 'A thin colored bar',
                                    children: listDisplay({
                                        entries: ALERTS.map(it => ({
                                            ...withoutText(it),
                                            icon: null
                                        }))
                                    })
                                }),
                                demoFrame({
                                    label: 'Titles only',
                                    children: listDisplay({
                                        entries: ALERTS.map(({title}) => ({title}))
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Clickable',
                        note: 'An onClick makes an entry clickable. A disabled entry is dimmed and takes no click.',
                        children: demoFrame({
                            className: 'tb-list-display-panel__narrow',
                            children: listDisplay({
                                dividers: true,
                                entries: withToastOnClick([
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
                                ])
                            })
                        })
                    }),
                    demoSection({
                        title: 'Narrow and Long Text',
                        note: 'At 240px. Titles and descriptions wrap beside the detail.',
                        children: demoGrid({
                            columns: 2,
                            children: [
                                demoFrame({
                                    className: 'tb-list-display-panel__slim',
                                    children: listDisplay({entries: ALERTS, dividers: true})
                                }),
                                demoFrame({
                                    className: 'tb-list-display-panel__slim',
                                    children: listDisplay({
                                        numbered: true,
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
                        children: demoGrid({
                            columns: 2,
                            children: [
                                demoFrame({
                                    label: 'No entries',
                                    children: listDisplay({
                                        entries: [],
                                        emptyText: 'No open alerts'
                                    })
                                }),
                                demoFrame({
                                    label: 'Every entry omitted',
                                    children: listDisplay({
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
                        children: demoFrame({
                            className:
                                'tb-list-display-panel__restyled tb-list-display-panel__narrow',
                            children: listDisplay({
                                entries: ALERTS.map(it => ({...it, icon: null}))
                            })
                        })
                    })
                ]
            })
        });
    }
});

function withoutText({title, icon, intent}: ListDisplayEntry): ListDisplayEntry {
    return {title, icon, intent};
}

/** The entries, each with an onClick that toasts its title. */
function withToastOnClick(entries: ListDisplayEntry[]): ListDisplayEntry[] {
    return entries.map(it => ({
        ...it,
        onClick: () => XH.toast({message: `Clicked: ${it.title}`})
    }));
}

class ListDisplayPanelModel extends HoistModel {
    @bindable accessor numbered = false;
    @bindable accessor dividers = true;
    @bindable accessor size: ListDisplayProps['size'] = null;
    @bindable accessor clickable = false;
    @bindable accessor showIcons = true;
    @bindable accessor showDescriptions = true;
    @bindable accessor showDetails = true;
    @bindable accessor showIntents = true;
    @bindable accessor empty = false;

    @observableRef accessor topFunds: ListDisplayEntry[] = [];

    /**
     * Props for the Playground list, less its entries. Options left off resolve to undefined, so
     * the snippet omits them. The snippet reads this same getter, so the code shown cannot drift
     * from the list beside it.
     */
    get listProps(): PlaygroundListProps {
        const {numbered, dividers, size} = this;
        return {
            numbered: numbered || undefined,
            dividers: dividers || undefined,
            size: size ?? undefined
        };
    }

    /** The alerts as the rail sets them. */
    get playgroundEntries(): ListDisplayEntry[] {
        const {empty, clickable, showIcons, showDescriptions, showDetails, showIntents} = this;
        if (empty) return [];
        const ret = ALERTS.map(({title, description, icon, intent, detail}) => ({
            title,
            description: showDescriptions ? description : undefined,
            icon: showIcons ? icon : undefined,
            intent: showIntents ? intent : undefined,
            detail: showDetails ? detail : undefined
        }));
        return clickable ? withToastOnClick(ret) : ret;
    }

    /** The code for `playgroundEntries`, for the snippet. Drops the fields the rail turns off. */
    get playgroundEntriesCode(): string {
        const {empty, clickable, showIcons, showDescriptions, showDetails, showIntents} = this;
        if (empty) return '[]';

        const omitted = [
                !showIcons && 'icon',
                !showDescriptions && 'description',
                !showDetails && 'detail',
                !showIntents && 'intent'
            ].filter(Boolean),
            param = omitted.length ? `({${omitted.join(', ')}, ...it})` : 'it',
            body = clickable ? '({...it, onClick: () => model.openAlert(it)})' : 'it';

        return param === 'it' && body === 'it' ? 'alerts' : `alerts.map(${param} => ${body})`;
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

/** The ListDisplay props the rail drives, as the plain values its inputs produce. */
interface PlaygroundListProps {
    numbered?: boolean;
    dividers?: boolean;
    size?: ListDisplayProps['size'];
}
