import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import type {LoadSpec} from '@xh/hoist/core';
import {dateTimeRenderer} from '@xh/hoist/format';
import {bindable, computed} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';

/** The feature requests users sent through the Architect, over a range of app days. */
export class FeatureRequestsModel extends HoistModel {
    @bindable accessor startDay: LocalDate = LocalDate.currentAppDay().subtract(6);
    @bindable accessor endDay: LocalDate = LocalDate.currentAppDay();

    @managed gridModel = new GridModel({
        store: {idSpec: 'id'},
        sortBy: 'submitted|desc',
        emptyText: 'No feature requests in this range.',
        enableExport: true,
        exportOptions: {filename: 'feature-requests'},
        columns: [
            {field: 'submitted', width: 140, renderer: dateTimeRenderer()},
            {field: 'user', width: 160},
            {field: 'app', width: 140},
            {field: 'category', width: 100},
            {field: 'summary', width: 260, tooltip: true},
            {field: 'userWords', headerName: "User's words", flex: 1, minWidth: 240, tooltip: true},
            {field: 'workaround', width: 220, tooltip: true},
            {field: 'blueprintType', headerName: 'Type', width: 130, hidden: true},
            {field: 'blueprintId', headerName: 'Blueprint', width: 160, hidden: true},
            {field: 'fragment', hidden: true, excludeFromExport: true}
        ]
    });

    /** The selected request's fragment, as JSON, or null if it has none. */
    @computed
    get selectedFragment(): string {
        const fragment = this.gridModel.selectedRecord?.data.fragment;
        return fragment ? JSON.stringify(fragment, null, 2) : null;
    }

    constructor() {
        super();
        this.addReaction({
            track: () => [this.startDay, this.endDay],
            run: () => this.refreshAsync()
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {startDay, endDay} = this,
            rows = await XH.fetchJson(
                {
                    url: 'blueprints/featureRequests',
                    params: {startDay: startDay.isoString, endDay: endDay.isoString}
                },
                {loadSpec}
            );
        if (loadSpec.isStale) return;
        this.gridModel.loadData(rows);
    }
}
