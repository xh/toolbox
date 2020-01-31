import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {roadmapDataViewItem} from './RoadmapDataViewItem';

@HoistModel
@LoadSupport
export class RoadmapDataViewModel {

    constructor() {
        this.addReaction({
            track: () => this.showReleasedOnly,
            run: () => this.dataViewModel.store.setFilter(
                (record) => {
                    if (this.showReleasedOnly) {
                        return record.data.status === 'RELEASED';
                    } else {
                        return record.data.status !== 'RELEASED';
                    }
                }
            ),
            fireImmediately: true
        });
    }

    @bindable
    showReleasedOnly = false;

    @managed
    dataViewModel = new DataViewModel({
        store: {
            fields: ['name', 'category', 'description', 'releaseVersion', 'status', 'gitLink', 'lastUpdated', 'lastUpdatedBy']
        },
        sortBy: 'name',
        emptyText: 'No projects found...',
        itemRenderer: (v, {record}) => roadmapDataViewItem({record}),
        contextMenu: [
            'copyCell'
        ],
        groupBy: 'status',
        itemHeight: 70,
        groupedItemHeight: 30
    });

    async doLoadAsync(loadSpec) {
        const {dataViewModel} = this,
            projects = await XH.fetchJson({url: 'rest/projectRest'});
        dataViewModel.loadData(projects.data);
    }
}