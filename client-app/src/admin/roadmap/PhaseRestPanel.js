import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {addAction, cloneAction, deleteAction, editAction, restGrid, viewAction} from '@xh/hoist/desktop/cmp/rest';
import {dateTimeRenderer} from '@xh/hoist/format';
import {emptyFlexCol} from '@xh/hoist/cmp/grid';
import {hoistCmp} from '@xh/hoist/core';

export const phaseRestPanel = hoistCmp.factory({
    render() {
        return panel({
            title: 'Roadmap Phase REST Editor',
            icon: Icon.edit(),
            item: restGrid({model: modelSpec})
        });
    }
});

const modelSpec = {
    enableExport: true,
    store: {
        url: 'rest/phaseRest',
        fields: [
            {
                name: 'name',
                lookupName: 'names',
                lookupStrict: true,
                required: true,
                enableCreate: true
            },
            {
                name: 'sortOrder',
                type: 'number'
            },
            {
                name: 'projects',
                editable: false
            },
            {
                name: 'lastUpdated',
                type: 'date',
                editable: false
            },
            {
                name: 'lastUpdatedBy',
                editable: false
            }
        ]
    },
    unit: 'phase',
    filterFields: ['name', 'sortOrder'],
    sortBy: 'sortOrder',
    columns: [

        {
            field: 'sortOrder',
            width: 120,
            align: 'center'
        },
        {
            field: 'name',
            width: 150
        },
        {
            field: 'projects',
            width: 300
        },
        {
            field: 'lastUpdated',
            headerName: 'Last Updated',
            renderer: dateTimeRenderer(),
            width: 150,
            align: 'right'
        },
        {
            field: 'lastUpdatedBy',
            headerName: 'By:',
            width: 150
        },
        {...emptyFlexCol}
    ],
    editors: [
        {field: 'name', label: 'Name'},
        {field: 'sortOrder'},
        {field: 'projects'},
        {field: 'lastUpdated', label: 'Last Updated'},
        {field: 'lastUpdatedBy', label: 'Last Updated By'}
    ],
    emptyText: 'No phases found - try adding one...',
    menuActions: [
        addAction,
        editAction,
        viewAction,
        deleteAction,
        cloneAction
    ],
    prepareCloneFn: ({record, clone}) => clone.name = `${clone.name}_CLONE`
};