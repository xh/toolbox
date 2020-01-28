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
import {Icon} from '@xh/hoist/icon/Icon';


@HoistModel
@LoadSupport
export class RoadmapPanelModel {
    @bindable
    groupBy = 'phase';

    data = [
        {
            id: 1,
            category: 'Grids',
            title: 'Inline Grid Editing',
            description: 'Adds ability to edit within the grid row. ADD A VERY LONG SENTENCE TO THIS DESCRIPTION.',
            phase: 'Q1 2020',
            release: 'Hoist 30',
            status: 'In Development',
            github: 'www.github.com/xh',
            lastUpdated: new Date(),
            lastUpdatedBy: 'Petra'
        },
        {
            id: 2,
            category: 'Dashboards',
            title: 'Rich Dashboards',
            description: 'Enhanced dashboards with drag-and-drop capabilities',
            phase: 'Q1 2020',
            release: 'Hoist 30',
            status: 'In Development',
            github: 'www.github.com/xh',
            lastUpdated: new Date(),
            lastUpdatedBy: 'Petra'
        },
        {
            id: 3,
            category: 'Grids',
            title: 'Grid Views',
            description: 'More view capabilities',
            phase: 'Q2 2020',
            release: '',
            status: 'Planned',
            github: 'www.github.com/xh',
            lastUpdated: new Date(),
            lastUpdatedBy: 'Petra'
        },
        {
            id: 4,
            category: 'PWA',
            title: 'Progressive Web Apps',
            description: 'Adding web applications to your desktop with a native desktop feel',
            phase: 'Q3-Q4 2020',
            release: '',
            status: 'Planned',
            github: 'www.github.com/xh',
            lastUpdated: new Date(),
            lastUpdatedBy: 'Petra'
        },
        {
            id: 5,
            category: 'Dialogs',
            title: 'Resizeable / Drag-and-Drop Dialogs',
            description: 'Enriched dialog capabilities',
            phase: 'Q1 2020',
            release: 'Hoist 30',
            status: 'Merged',
            github: 'www.github.com/xh',
            lastUpdated: new Date(),
            lastUpdatedBy: 'Petra'
        }
    ];

    @managed
    gridModel = new GridModel({
        rowBorders: true,
        showHover: true,
        compact: XH.appModel.useCompactGrids,
        columns: [
            {
                field: 'status',
                headerName: 'Status',
                width: 80,
                elementRenderer: this.statusRenderer,
                tooltip: (status) => status,
                align: 'center'
            },
            {
                field: 'category',
                headerName: 'Category',
                width: 100
            },
            {
                field: 'title',
                headerName: 'Title',
                tooltip: (title) => title,
                width: 200
            },
            {
                field: 'description',
                headerName: 'Description',
                tooltip: (desc) => desc,
                width: 600
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
                field: 'github',
                headerName: 'Github Link',
                tooltip: (github) => github,
                width: 100
            },
            {
                field: 'lastUpdated',
                ...localDateCol,
                headerName: 'Last Updated',
                width: 200,
                renderer: dateTimeRenderer('YYYY-MM-DD h:mma')
            },
            {
                field: 'lastUpdatedBy',
                headerName: 'By:',
                tooltip: (date) => date,
                width: 100
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
        gridModel.store.loadData(this.data);
    }

    statusRenderer(val) {
        switch (val) {
            case 'Released':
                return Icon.bullhorn({className: 'xh-red'});
            case 'Merged':
                return Icon.check({className: 'xh-green'});
            case 'In Development':
                return Icon.code({className: 'xh-blue'});
            case 'Planned':
                return Icon.experiment({className: 'xh-orange'});
            default:
                return null;
        }
    }
}