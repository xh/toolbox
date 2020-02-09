import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {roadmapGroupRow} from './RoadmapView';
import {roadmapViewItem} from './RoadmapViewItem';
import './RoadmapView.scss';

@HoistModel
@LoadSupport
export class RoadmapModel {

    constructor() {
        this.addReaction({
            track: () => this.statusFilter,
            run: (filter) => this.dataViewModel.store.setFilter(
                (record) => {
                    const {status} = record.data,
                        showReleased = filter == 'showReleased';
                    return showReleased ? status == 'RELEASED' : status != 'RELEASED';
                }
            ),
            fireImmediately: true
        });

    }

    @bindable
    statusFilter = 'showPipeline';

    @managed
    dataViewModel = new DataViewModel({
        store: {
            fields: [
                'name', 'phaseOrder', 'phaseName', 'category', 'description', 'releaseVersion',
                'status', 'gitLinks', 'sortOrder', 'lastUpdated', 'lastUpdatedBy'
            ]
        },
        sortBy: 'sortOrder',
        itemHeight: 130,
        itemRenderer: (v, {record}) => roadmapViewItem({record}),
        groupBy: 'phaseOrder',
        groupRowHeight: 32,
        groupRowRenderer: ({node}) => roadmapGroupRow({node}),
        emptyText: 'No projects found...',
        selModel: 'disabled',
        rowBorders: true,
        showHover: true
    });

    async doLoadAsync(loadSpec) {
        const {dataViewModel} = this,
            resp = await XH.fetchJson({
                url: 'roadmap/data',
                loadSpec
            });

        const projects = this.processData(resp.data);
        dataViewModel.loadData(projects);
    }

    processData(rawData) {
        return rawData.flatMap(phase => {
            return phase.projects.map(project => {
                return {...project, phaseOrder: phase.sortOrder, phaseName: phase.name};
            });
        });
    }
}


