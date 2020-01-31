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
import {wrapper} from '../../../src/desktop/common/Wrapper';

export const RoadmapTab = hoistCmp.factory({

    render() {
        return wrapper({
            item: panel({
                title: 'Hoist Roadmap REST Editor',
                icon: Icon.edit(),
                width: 900,
                height: 600,
                item: restGrid({model: modelSpec})
            })
        });
    }
});

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
                name: 'gitLink',
                required: true
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
            width: 80
        },
        {
            field: 'name',
            headerName: 'Title',
            tooltip: (name) => name,
            width: 120
        },
        {
            field: 'description',
            tooltip: (desc) => desc,
            width: 200
        },
        {
            field: 'releaseVersion',
            headerName: 'Release',
            tooltip: (release) => release,
            width: 100
        },
        {
            field: 'gitLink',
            headerName: 'GitHub',
            width: 100
        },
        {
            field: 'status',
            width: 100
        },
        {
            field: 'lastUpdated',
            headerName: 'Last Updated',
            width: 120,
            tooltip: (lastUpdated) => lastUpdated,
            align: 'right'
        },
        {
            field: 'lastUpdatedBy',
            headerName: 'By:',
            width: 80
        },
        {...emptyFlexCol}
    ],
    editors: [
        {field: 'name', label: 'Title'},
        {field: 'category'},
        {field: 'status'},
        {field: 'description'},
        {field: 'releaseVersion'},
        {field: 'gitLink'},
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
