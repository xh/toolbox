/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2020 Extremely Heavy Industries Inc.
 */

import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {
    restGrid,
    addAction,
    editAction,
    viewAction,
    deleteAction,
    cloneAction
} from '@xh/hoist/desktop/cmp/rest';
import {emptyFlexCol} from '@xh/hoist/cmp/grid';

export const roadmapTab = hoistCmp.factory({

    render() {
        return panel({
            title: 'Hoist Roadmap REST Editor',
            icon: Icon.edit(),
            item: restGrid({model: modelSpec})
        });
    }
});
const tooltip = s => s;

const modelSpec = {
    enableExport: true,
    store: {
        url: 'rest/projectRest',
        fields: [
            {
                name: 'category',
                required: true
            },
            {
                name: 'name',
                required: true
            },
            {
                name: 'description',
                required: true
            },
            {
                name: 'releaseVersion',
                required: false
            },
            {
                name: 'status',
                lookupName: 'statuses',
                lookupStrict: true,
                required: true
            },
            {
                name: 'lastUpdated',
                type: 'date',
                editable: false
            },
            {
                field: 'gitLinks',
                type: 'json'
            },
            {
                name: 'lastUpdatedBy',
                editable: true
            }
        ]
    },
    unit: 'project',
    filterFields: ['name', 'status', 'category'],
    sortBy: 'name',
    columns: [
        {
            field: 'category',
            width: 150
        },
        {
            field: 'name',
            headerName: 'Title',
            tooltip,
            width: 250
        },
        {
            field: 'description',
            tooltip,
            width: 650
        },
        {
            field: 'releaseVersion',
            headerName: 'Release',
            tooltip,
            width: 150
        },
        {
            field: 'status',
            width: 150
        },
        {
            field: 'lastUpdated',
            headerName: 'Last Updated',
            width: 200,
            tooltip,
            align: 'right'
        },
        {
            field: 'lastUpdatedBy',
            headerName: 'By:',
            width: 100
        },
        {...emptyFlexCol}
    ],
    editors: [
        {field: 'name', label: 'Title'},
        {field: 'category'},
        {field: 'status'},
        {field: 'description'},
        {field: 'gitLinks'},
        {field: 'releaseVersion'},
        {field: 'lastUpdatedBy', label: 'Last Updated By'}
    ],
    emptyText: 'No projects found - try adding one...',
    menuActions: [
        addAction,
        editAction,
        viewAction,
        deleteAction,
        cloneAction
    ],
    prepareCloneFn: ({record, clone}) => clone.name = `${clone.name}_CLONE`
};
