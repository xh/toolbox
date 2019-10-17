import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dateRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {restGrid, addAction, editAction, viewAction, deleteAction, cloneAction} from '@xh/hoist/desktop/cmp/rest';
import {boolCheckCol, numberCol, emptyFlexCol} from '@xh/hoist/cmp/grid';
import {wrapper} from '../../common/Wrapper';
import {numberInput, textArea, switchInput} from '@xh/hoist/desktop/cmp/input';
import {ExportFormat} from '@xh/hoist/cmp/grid/columns';
import {actionCol} from '@xh/hoist/desktop/cmp/grid/columns';

export const RestGridPanel = hoistCmp({

    render() {
        return wrapper({
            description: [
                <p>
                    RestGrid and its associated components provide a quick way to implement basic
                    CRUD functionality for domain objects managed by the Hoist Grails server.
                </p>,
                <p>
                    Use the toolbar buttons or double-click a record to display its associated
                    add/edit form, including type-specific editor fields. These grids are especially
                    useful when building lookup tables of simple objects and are used throughout
                    the <a href="/admin" target="_blank">Hoist Admin Console</a>.
                </p>
            ],
            item: panel({
                title: 'Grids › REST Editor',
                icon: Icon.edit(),
                className: 'tb-grid-wrapper-panel',
                item: restGrid({model: modelSpec, onRowDoubleClicked: null})
            })
        });
    }
});

const modelSpec = {
    enableExport: true,
    store: {
        url: 'rest/companyRest',
        fields: [
            {
                name: 'name',
                required: true
            },
            {
                name: 'type',
                lookupName: 'types',
                lookupStrict: true,
                required: true
            },
            {
                name: 'employees',
                label: 'Employees (#)',
                type: 'number',
                required: true
            },
            {
                name: 'isActive',
                label: 'Active?',
                type: 'bool',
                defaultValue: true
            },
            {
                name: 'cfg',
                label: 'JSON Config',
                type: 'json'
            },
            {
                name: 'earningsDate',
                type: 'localDate',
                required: true
            },
            {
                name: 'note'
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
    unit: 'company',
    filterFields: ['name', 'type', 'note'],
    sortBy: 'name',
    columns: [
        {
            ...actionCol,
            actions: [
                {
                    icon: Icon.save(),
                    intent: 'primary',
                    displayFn: ({record}) => ({disabled: !record.isDirty}),
                    actionFn: ({record, store}) => store.saveRecordAsync(record)
                }
            ]
        },
        {
            field: 'name',
            width: 200,
            editable: true
        },
        {
            field: 'type',
            width: 120
        },
        {
            field: 'employees',
            ...numberCol,
            headerName: 'Employees',
            width: 120
        },
        {
            field: 'isActive',
            ...boolCheckCol,
            headerName: 'Active?',
            width: 100
        },
        {
            field: 'earningsDate',
            renderer: dateRenderer(),
            width: 140,
            exportFormat: ExportFormat.DATE_FMT
        },
        {
            field: 'note',
            width: 200
        },
        {...emptyFlexCol}
    ],
    editors: [
        {field: 'name'},
        {field: 'type'},
        {field: 'employees', formField: {item: numberInput({displayWithCommas: true})}},
        {field: 'isActive', formField: {item: switchInput()}},
        {field: 'cfg'},
        {field: 'earningsDate'},
        {field: 'note', formField: {item: textArea()}},
        {field: 'lastUpdated'},
        {field: 'lastUpdatedBy'}
    ],
    emptyText: 'No companies found - try adding one...',
    menuActions: [
        addAction,
        editAction,
        viewAction,
        deleteAction,
        cloneAction
    ],
    prepareCloneFn: ({record, clone}) => clone.name = `${clone.name}_CLONE`
};