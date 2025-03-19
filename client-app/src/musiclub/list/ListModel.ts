import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {div, h1, h2, hbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, HoistModel, HoistProps, LoadSpec, managed, XH} from '@xh/hoist/core';
import {StoreRecord} from '@xh/hoist/data';
import {action, makeObservable, observable} from '@xh/hoist/mobx';

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
                return hbox({
                    className: `mc-list__item mc-list__item--${record.data.dimension}`,
                    items: [
                        div(
                            h1(record.data.title),
                            h2({
                                item: record.data.subtitle,
                                omit: !record.data.subtitle
                            })
                        ),
                        countTiles({count: record.data.count, bonusCount: record.data.bonusCount})
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
            data = [];

        byYear.forEach(grp => {
            data.push(
                {
                    id: grp.id,
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
                        dimension: 'meeting',
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
        if (rec?.data.dimension === 'year') {
            this.expandedGroups = {
                ...this.expandedGroups,
                [rec.id]: !this.expandedGroups[rec.id]
            };
        }
    }
}

const countTiles = hoistCmp.factory<HoistProps & {count: number; bonusCount: number}>({
    render({count, bonusCount}) {
        return hbox({
            className: 'mc-count-tiles',
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
