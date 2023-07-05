import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dateRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {
    addAction,
    cloneAction,
    deleteAction,
    editAction,
    restGrid,
    RestGridConfig,
    viewAction
} from '@xh/hoist/desktop/cmp/rest';
import {boolCheckCol, ExcelFormat, numberCol} from '@xh/hoist/cmp/grid';
import {wrapper} from '../../common';
import {numberInput, switchInput, textArea} from '@xh/hoist/desktop/cmp/input';

export const restGridPanel = hoistCmp.factory({
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
                    useful when building lookup tables of simple objects and are used throughout the{' '}
                    <a href="/admin" target="_blank">
                        Hoist Admin Console
                    </a>
                    .
                </p>
            ],
            item: panel({
                title: 'Grids › REST Editor',
                icon: Icon.edit(),
                className: 'tb-grid-wrapper-panel',
                item: restGrid({modelConfig: modelSpec})
            })
        });
    }
});

const modelSpec: RestGridConfig = {
    enableExport: true,
    store: {
        url: 'rest/companyRest',
        fields: [
            {
                name: 'name',
                type: 'string',
                required: true
            },
            {
                name: 'type',
                type: 'string',
                lookupName: 'types',
                required: true
            },
            {
                name: 'employees',
                displayName: 'Employees (#)',
                type: 'number',
                required: true
            },
            {
                name: 'isActive',
                displayName: 'Active?',
                type: 'bool',
                defaultValue: true
            },
            {
                name: 'cfg',
                displayName: 'JSON Config',
                type: 'json'
            },
            {
                name: 'earningsDate',
                type: 'localDate',
                required: true
            },
            {
                name: 'note',
                type: 'string'
            },
            {
                name: 'lastUpdated',
                type: 'date',
                editable: false
            },
            {
                name: 'lastUpdatedBy',
                type: 'string',
                editable: false
            }
        ]
    },
    unit: 'company',
    filterFields: ['name', 'type', 'note'],
    sortBy: 'name',
    columns: [
        {
            field: 'name',
            width: 200
        },
        {
            field: 'type',
            width: 120
        },
        {
            field: 'employees',
            ...numberCol,
            width: 120
        },
        {
            field: 'isActive',
            ...boolCheckCol,
            width: 100
        },
        {
            field: 'earningsDate',
            renderer: dateRenderer(),
            width: 140,
            excelFormat: ExcelFormat.DATE_FMT
        },
        {
            field: 'note',
            width: 200
        }
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
    menuActions: [addAction, editAction, viewAction, deleteAction, cloneAction],
    prepareCloneFn: ({record, clone}) => (clone.name = `${clone.name}_CLONE`)
};
