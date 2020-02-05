import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {addAction, cloneAction, deleteAction, editAction, restGrid, viewAction} from '@xh/hoist/desktop/cmp/rest';
import {emptyFlexCol} from '@xh/hoist/cmp/grid';
import {hoistCmp} from '@xh/hoist/core';
import {boolCheckCol} from '@xh/hoist/cmp/grid/columns';

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
        reloadLookupsOnLoad: true,
        fields: [
            {
                name: 'name',
                required: true
            },
            {
                name: 'sortOrder',
                type: 'number'
            },
            {   name: 'clientVisible',
                type: 'bool',
                defaultValue: true,
                required: true
            },
            {
                name: 'projectNames',
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
            field: 'clientVisible',
            headerName: 'Display to Client?',
            ...boolCheckCol,
            width: 150
        },
        {
            field: 'projectNames',
            headerName: 'Projects',
            width: 400
        },
        {...emptyFlexCol}
    ],
    editors: [
        {field: 'name', label: 'Name'},
        {field: 'sortOrder'},
        {field: 'clientVisible'},
        {field: 'projectNames', label: 'Projects'}
    ],
    emptyText: 'No phases found - try adding one...',
    menuActions: [
        addAction,
        editAction,
        viewAction,
        deleteAction,
        cloneAction
    ],
    actionWarning: {
        del: 'Warning: Deleting this phase will also delete all projects associated with it. Continue anyway?'
    },
    prepareCloneFn: ({record, clone}) => clone.name = `${clone.name}_CLONE`
};