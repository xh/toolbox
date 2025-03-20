import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {div, h1, h2, hbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistModel, HoistProps, LoadSpec, managed, XH} from '@xh/hoist/core';
import {StoreRecord} from '@xh/hoist/data';
import {action, makeObservable, observable} from '@xh/hoist/mobx';
import {MeetingDim} from '../Types';

export class ListModel extends HoistModel {
    @managed dataViewModel: DataViewModel;

    @observable.ref expandedGroups: Record<string, boolean> = {};

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
            sortBy: 'sortKey',
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

        this.addReaction({
            track: () => [this.expandedGroups, this.lastLoadCompleted],
            run: () => this.updateFilter()
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const byYear = XH.clubService.getByYear(),
            data: RowData[] = [];

        byYear.forEach(grp => {
            data.push(
                {
                    id: grp.id,
                    groupId: grp.id,
                    title: grp.title,
                    dimension: grp.dimension,
                    count: grp.meetingCount,
                    sortKey: grp.id
                },
                ...grp.meetings.map((mtg, idx) => {
                    return {
                        id: mtg.id,
                        groupId: grp.id,
                        title: mtg.date.toString(),
                        subtitle: mtg.location,
                        dimension: 'meeting' as const,
                        count: mtg.plays.filter(it => !it.isBonus).length,
                        bonusCount: mtg.plays.filter(it => it.isBonus).length,
                        sortKey: `${grp.id}|${idx}`
                    };
                })
            );
        });

        this.dataViewModel.loadData(data);
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

        if (dim === 'year') {
            this.expandedGroups = {
                ...grps,
                [rec.id]: !grps[rec.id]
            };
        } else if (dim === 'meeting') {
            XH.appendRoute('meeting', {id: rec.id});
        }
    }
}

const countTiles = hoistCmp.factory<
    HoistProps & {count: number; bonusCount: number; big?: boolean}
>({
    render({count, bonusCount, big}) {
        return hbox({
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
    id: string;
    groupId: string;
    title: string;
    subtitle?: string;
    dimension: MeetingDim;
    count: number;
    bonusCount?: number;
    sortKey: string;
}
