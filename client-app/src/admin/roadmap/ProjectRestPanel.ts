import {
    addAction,
    cloneAction,
    deleteAction,
    editAction,
    restGrid,
    RestGridConfig,
    viewAction
} from '@xh/hoist/desktop/cmp/rest';
import {dateTimeRenderer} from '@xh/hoist/format';
import {codeInput, textArea} from '@xh/hoist/desktop/cmp/input';
import {hoistCmp} from '@xh/hoist/core';
import {toNumber} from 'lodash';
import {AppModel} from '@xh/hoist/admin/AppModel';

export const projectRestPanel = hoistCmp.factory(() =>
    restGrid({modelConfig: {...modelSpec, readonly: AppModel.readonly}})
);

const tooltip = s => s;

const modelSpec: RestGridConfig = {
    enableExport: true,
    store: {
        url: 'rest/projectRest',
        reloadLookupsOnLoad: true,
        fields: [
            {
                name: 'category',
                lookupName: 'categories',
                required: true,
                enableCreate: true
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
                name: 'phaseOrder',
                editable: false
            },
            {
                name: 'phaseName',
                required: true,
                lookupName: 'phases'
            },
            {
                name: 'releaseVersion',
                lookupName: 'releaseVersions',
                enableCreate: true
            },
            {
                name: 'status',
                lookupName: 'statuses',
                required: true
            },
            {
                name: 'lastUpdated',
                type: 'date',
                editable: false
            },
            {
                name: 'gitLinks',
                type: 'json'
            },
            {
                name: 'sortOrder',
                type: 'int',
                required: true
            },
            {
                name: 'lastUpdatedBy',
                editable: false
            }
        ]
    },
    unit: 'project',
    filterFields: ['name', 'status', 'category'],
    sortBy: ['phaseOrder', 'sortOrder'],
    groupBy: 'phaseOrder',
    groupSortFn: (a, b) => toNumber(a) - toNumber(b),
    groupRowRenderer: ({node}) => {
        const projectRec = node.allLeafChildren[0].data;
        return projectRec.data.phaseName;
    },
    columns: [
        {
            field: 'sortOrder',
            headerName: 'Sort',
            align: 'right',
            width: 80
        },
        {
            field: 'category',
            width: 150
        },
        {
            field: 'name',
            headerName: 'Title',
            tooltip,
            width: 300
        },
        {
            field: 'description',
            tooltip,
            flex: 1
        },
        {
            field: 'phaseName',
            hidden: true
        },
        {
            field: 'phaseOrder',
            hidden: true
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
            renderer: dateTimeRenderer(),
            width: 150,
            tooltip,
            align: 'right'
        },
        {
            field: 'lastUpdatedBy',
            width: 150
        }
    ],
    editors: [
        {field: 'name', formField: {label: 'Title'}},
        {field: 'category'},
        {field: 'phaseName'},
        {field: 'status'},
        {field: 'sortOrder'},
        {
            field: 'description',
            formField: {
                item: textArea({height: 150})
            }
        },
        {
            field: 'gitLinks',

            formField: {
                item: codeInput({height: 150}),
                label: 'Github Links',
                info: '(One per line)'
            }
        },
        {field: 'releaseVersion'},
        {field: 'lastUpdated', formField: {label: 'Last Updated'}},
        {field: 'lastUpdatedBy', formField: {label: 'Last Updated By'}}
    ],
    emptyText: 'No projects found - try adding one...',
    menuActions: [addAction, editAction, viewAction, deleteAction, cloneAction],
    prepareCloneFn: ({record, clone}) => (clone.name = `${clone.name}_CLONE`)
};
