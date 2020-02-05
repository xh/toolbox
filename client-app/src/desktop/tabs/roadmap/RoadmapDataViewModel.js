import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {roadmapDataViewItem} from './RoadmapDataViewItem';
import {roadmapGroupItem} from './RoadmapGroupItem';
import './RoadmapDataView.scss';

@HoistModel
@LoadSupport
export class RoadmapDataViewModel {

    constructor() {
        this.addReaction({
            track: () => this.showReleasedOnly,
            run: () => this.dataViewModel.store.setFilter(
                (record) => {
                    if (this.showReleasedOnly) {
                        return record.data.projects.filter((project) => project.status === 'RELEASED')
                    } else {
                        return record.data.projects
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
            fields: ['name', 'sortOrder', 'clientVisible', 'projects']
        },
        sortBy: 'sortOrder',
        itemHeight: 140,
        itemRenderer: (v, {record}) => {
            record.data.projects.forEach(project => new DataViewModel({
                store: {fields: [
                    'name', 'description'
                    ]},
                itemRenderer: (v, {record}) => roadmapDataViewItem({record})
            }))
        },
        groupBy: 'name',
        groupedItemHeight: 30,
        groupRowRenderer: ({node}) => roadmapGroupItem({node}),
        contextMenu: [
            'copyCell',
            '-',
            'expandCollapseAll'
        ],
        emptyText: 'No projects found...',
        rowBorders: true,
        showHover: true,
        stripeRows: false,
        sizingMode: 'standard'
    });

    async doLoadAsync(loadSpec) {
        const {dataViewModel} = this,
            phases = await XH.fetchJson({url: 'rest/phaseRest'});
        dataViewModel.loadData(phases.data);
    }
}