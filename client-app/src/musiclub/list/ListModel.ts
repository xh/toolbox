import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {div, h1, h2, hbox, vbox} from '@xh/hoist/cmp/layout';
import {
    hoistCmp,
    HoistModel,
    HoistProps,
    LoadSpec,
    managed,
    persist,
    PersistOptions,
    XH
} from '@xh/hoist/core';
import {StoreRecord} from '@xh/hoist/data';
import {action, bindable, makeObservable} from '@xh/hoist/mobx';
import {Meeting, MeetingDim} from '../Types';

export class ListModel extends HoistModel {
    override persistWith: PersistOptions = {localStorageKey: 'musiclubList'};

    @managed dataViewModel: DataViewModel;

    @bindable @persist dim: MeetingDim = 'year';
    @bindable @persist sort: 'asc' | 'desc' = 'asc';
    @bindable.ref expandedGroups: Record<string, boolean> = {};

    constructor() {
        super();
        makeObservable(this);

        this.dataViewModel = new DataViewModel({
            store: {
                fields: [
                    {name: 'groupId', type: 'string'},
                    {name: 'title', type: 'string'},
                    {name: 'subtitle', type: 'string'},
                    {name: 'dimension', type: 'string'},
                    {name: 'sortKey', type: 'string'},
                    {name: 'count', type: 'number', defaultValue: 0},
                    {name: 'bonusCount', type: 'number', defaultValue: 0}
                ]
            },
            sortBy: `sortKey|${this.sort}`,
            selModel: null,
            showHover: false,
            itemHeight: 100,
            renderer: (v, {record}) => {
                const row = record.data as RowData;
                return hbox({
                    className: `mc-list__item mc-list__item--${row.dimension}`,
                    items: [
                        div(
                            h1(row.title),
                            h2({
                                item: row.subtitle,
                                omit: !row.subtitle
                            })
                        ),
                        countTiles({
                            count: row.count,
                            bonusCount: row.bonusCount,
                            big: row.dimension !== 'meeting'
                        })
                    ]
                });
            },
            onRowClicked: ({data}) => this.onRowTap(data)
        });

        this.addReaction(
            {
                track: () => this.dim,
                run: () => {
                    this.expandedGroups = {};
                    this.refreshAsync();
                }
            },
            {
                track: () => this.sort,
                run: () => {
                    this.dataViewModel.setSortBy(`sortKey|${this.sort}`);
                }
            },
            {
                track: () => [this.expandedGroups, this.lastLoadCompleted],
                run: () => this.updateFilter()
            }
        );
    }

    toggleSort() {
        this.sort = this.sort === 'asc' ? 'desc' : 'asc';
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {dim} = this,
            groups = XH.clubService.getMeetingsBy(dim),
            data: RowData[] = [];

        groups.forEach(grp => {
            const groupId = `${grp.dimension}-${grp.id}`;
            data.push(
                {
                    id: groupId,
                    groupId,
                    title: grp.title,
                    dimension: grp.dimension,
                    count: grp.meetingCount,
                    sortKey: groupId
                },
                ...grp.meetings.map((mtg, idx) => {
                    return {
                        id: mtg.slug,
                        groupId: groupId,
                        title: this.getMeetingTitle(mtg),
                        subtitle: this.getMeetingSubtitle(mtg),
                        dimension: 'meeting' as const,
                        count: mtg.plays.filter(it => !it.bonus).length,
                        bonusCount: mtg.plays.filter(it => it.bonus).length,
                        sortKey: `${groupId}|${mtg.date}`
                    };
                })
            );
        });

        this.dataViewModel.loadData(data);
    }

    getMeetingTitle(mtg: Meeting) {
        const date =
            this.dim === 'dateYear' ? mtg.date.format('MMM-DD') : mtg.date.format('YYYY-MM-DD');
        return `#${mtg.slug} ${date}`;
    }

    getMeetingSubtitle(mtg: Meeting) {
        const {dim} = this;
        if (dim === 'year') return mtg.location;
        if (dim === 'location') return `${mtg.year}`;
        return `${mtg.year} - ${mtg.location}`;
    }

    private updateFilter() {
        this.dataViewModel.store.setFilter(rec => {
            return (
                rec.data.dimension !== 'meeting' || this.expandedGroups[rec.data.groupId] === true
            );
        });
    }

    @action
    private onRowTap(rec: StoreRecord) {
        const grps = this.expandedGroups,
            dim: MeetingDim = rec?.data.dimension;

        if (dim === 'meeting') {
            XH.appendRoute('meeting', {slug: rec.id});
        } else {
            this.expandedGroups = {
                ...grps,
                [rec.id]: !grps[rec.id]
            };
        }
    }
}

const countTiles = hoistCmp.factory<
    HoistProps & {count: number; bonusCount: number; big?: boolean}
>({
    render({count, bonusCount, big}) {
        return vbox({
            className: `mc-count-tiles ${big ? 'mc-count-tiles--big' : ''}`,
            items: [
                ...Array.from({length: count ?? 0}).map(_ => {
                    return div({
                        className: 'mc-count-tiles__tile'
                    });
                }),
                ...Array.from({length: bonusCount ?? 0}).map(_ => {
                    return div({
                        className: 'mc-count-tiles__tile mc-count-tiles__tile--bonus'
                    });
                })
            ]
        });
    }
});

interface RowData {
    id: string | number;
    groupId: string;
    title: string;
    subtitle?: string;
    dimension: MeetingDim;
    count: number;
    bonusCount?: number;
    sortKey: string;
}
