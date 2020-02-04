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
    sortBy: 'name',
    columns: [
        {
            field: 'name',
            width: 100
        },
        {
            field: 'sortOrder',
            width: 100
        },
        {
            field: 'lastUpdated',
            headerName: 'Last Updated',
            renderer: dateTimeRenderer(),
            width: 200,
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
        {field: 'name', label: 'Name'},
        {field: 'sortOrder'},
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