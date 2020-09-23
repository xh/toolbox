import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {roadmapViewItem} from './RoadmapViewItem';
import './RoadmapView.scss';
import {Icon} from '@xh/hoist/icon';
import {toNumber} from 'lodash';

@HoistModel
@LoadSupport
export class RoadmapModel {

    @bindable
    statusFilter = 'showUpcoming';

    @managed
    dataViewModel = new DataViewModel({
        store: {
            fields: [
                'name', 'sortedPhase', 'phaseName', 'category', 'description', 'releaseVersion',
                'status', 'gitLinks', 'sortOrder', 'lastUpdated', 'lastUpdatedBy'
            ]
        },
        itemHeight: 130,
        elementRenderer: (v, {record}) => roadmapViewItem({record}),
        sortBy: 'sortOrder',
        groupBy: 'sortedPhase',
        groupRowHeight: 32,
        groupSortFn: (a, b) => {
            a = toNumber(a);
            b = toNumber(b);
            return this.statusFilter === 'showUpcoming' ? a - b : b - a;
        },
        groupRowRenderer: ({node}) => {
            const projectRec = node.allLeafChildren[0].data;
            return Icon.calendar({asHtml: true}) + ' ' + projectRec.data.phaseName;
        },
        emptyText: 'No projects found...',
        selModel: 'disabled',
        rowBorders: true,
        showHover: true
    });

    constructor() {
        this.addReaction({
            track: () => this.statusFilter,
            run: () => this.loadAsync()
        });

    }

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
        const showReleased = this.statusFilter === 'showReleased';
        const projects = rawData.flatMap(phase => {
            return phase.projects.map(project => {
                return {...project, sortedPhase: phase.sortOrder};
            });
        });

        return projects.filter(project => {
            const {status} = project;
            return showReleased ? status === 'RELEASED' : status !== 'RELEASED';
        });
    }
}


