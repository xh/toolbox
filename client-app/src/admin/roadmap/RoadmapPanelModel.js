/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2020 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel, LoadSupport} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {managed} from '@xh/hoist/core/mixins';
import {GridModel} from '@xh/hoist/cmp/grid';
import {localDateCol} from '@xh/hoist/cmp/grid/columns';
import {dateTimeRenderer} from '@xh/hoist/format';


@HoistModel
@LoadSupport
export class RoadmapPanelModel {
    @bindable
    groupBy = 'phase';
    data = {
        title: 'Inline Grid Editing',
        description: 'Adds ability to edit within the grid row',
        phase: 'Q1 2020',
        release: 'Hoist 30',
        status: 'In Development',
        github: 'www.github.com/xh',
        lastUpdated: new Date(),
        lastUpdatedBy: 'Petra'
    }
    @managed
    gridModel = new GridModel({
        store: {
            data: this.data,
        },
        rowBorders: true,
        showHover: true,
        compact: XH.appModel.useCompactGrids,
        columns: [
            {
                field: 'title',
                headerName: 'Title',
                width: 200
            },
            {
                field: 'description',
                headerName: 'Description',
                width: 300
            },
            {
                field: 'phase',
                headerName: 'Phase',
                width: 100
            },
            {
                field: 'release',
                headerName: 'Release',
                width: 100
            },
            {
                field: 'status',
                headerName: 'Status',
                width: 100
            },
            {
                field: 'github',
                headerName: 'Github Link',
                width: 100
            },
            {
                field: 'lastUpdated',
                ...localDateCol,
                headerName: 'Last Updated',
                width: 150,
                renderer: dateTimeRenderer
            },
            {
                field: 'lastUpdatedBy',
                headerName: 'Last Updated By:',
                width: 150
            }
        ]
    });

    constructor() {
        const {gridModel} = this;

        this.addReaction({
            track: () => this.groupBy,
            run: (selectedGroup) => gridModel.setGroupBy(selectedGroup)
        });

        const {groupBy} = gridModel;
        this.setGroupBy(groupBy && groupBy.length > 0 ? groupBy[0] : null);
    }
}