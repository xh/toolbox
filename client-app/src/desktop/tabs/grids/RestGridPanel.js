/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {restGrid, RestGridModel, RestStore} from '@xh/hoist/desktop/cmp/rest';
import {boolCheckCol, baseCol} from '@xh/hoist/columns';
import {wrapper} from '../../common/Wrapper';

@HoistComponent()
export class RestGridPanel extends Component {

    localModel = new RestGridModel({
        store: new RestStore({
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
                    label: 'Employee Count',
                    type: 'number',
                    required: true
                },
                {
                    name: 'isActive',
                    type: 'bool',
                    defaultValue: true
                },
                {
                    name: 'cfg',
                    label: 'JSON Config',
                    type: 'json'
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
        }),
        unit: 'company',
        filterFields: ['name', 'type', 'note'],
        sortBy: 'name',
        columns: [
            baseCol({field: 'name'}),
            baseCol({field: 'type'}),
            baseCol({field: 'employees'}),
            boolCheckCol({field: 'isActive', fixedWidth: 100})
        ],
        editors: [
            {field: 'name'},
            {field: 'type'},
            {field: 'employees'},
            {field: 'cfg'},
            {field: 'note', type: 'textarea'},
            {field: 'isActive', type: 'boolCheck'},
            {field: 'lastUpdated'},
            {field: 'lastUpdatedBy'}
        ]
    });

    constructor() {
        super();
        this.model.loadAsync();
    }

    render() {
        const {model} = this;

        return wrapper(
            panel({
                title: 'Grids > REST Editor',
                icon: Icon.edit(),
                width: 700,
                height: 400,
                item: restGrid({model})
            })
        );
    }

}