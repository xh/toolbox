import {HoistModel, managed, XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {roadmapViewItem} from './RoadmapViewItem';
import './RoadmapWidget.scss';
import {Icon} from '@xh/hoist/icon';
import {toNumber} from 'lodash';
import {span} from '@xh/hoist/cmp/layout';

export class RoadmapModel extends HoistModel {
    @bindable
    statusFilter = 'showUpcoming';

    @managed
    dataViewModel = new DataViewModel({
        store: {
            fields: [
                {name: 'name', type: 'string'},
                {name: 'sortedPhase', type: 'int'},
                {name: 'phaseName', type: 'string'},
                {name: 'category', type: 'string'},
                {name: 'description', type: 'string'},
                {name: 'releaseVersion', type: 'string'},
                {name: 'status', type: 'string'},
                {name: 'gitLinks', type: 'string'},
                {name: 'sortOrder', type: 'int'},
                {name: 'lastUpdated', type: 'date'},
                {name: 'lastUpdatedBy', type: 'string'}
            ]
        },
        itemHeight: 150,
        renderer: (v, {record}) => roadmapViewItem({record}),
        sortBy: 'sortOrder',
        groupBy: 'sortedPhase',
        groupRowHeight: 32,
        groupRowRenderer: ({node}) => {
            const projectRec = node.allLeafChildren[0]?.data;
            return projectRec ? span(Icon.calendar(), projectRec.data.phaseName) : null;
        },
        emptyText: 'No projects found...',
        selModel: 'disabled',
        rowBorders: true,
        showHover: true,
        groupSortFn: (a, b) => {
            const aVal = toNumber(a),
                bVal = toNumber(b);
            return this.statusFilter === 'showUpcoming' ? aVal - bVal : bVal - aVal;
        }
    });

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => this.statusFilter,
            run: () => this.refreshAsync()
        });
    }

    override async doLoadAsync(loadSpec) {
        const {dataViewModel} = this,
            resp = await XH.fetchJson({
                url: 'roadmap/data',
                loadSpec
            });

        const projects = this.processData(resp.data);
        dataViewModel.loadData(projects);
    }

    private processData(rawData) {
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
