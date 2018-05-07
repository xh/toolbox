/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {hoistComponent} from 'hoist/core';
import {vframe} from 'hoist/layout';
import {panel} from 'hoist/cmp';
import {restGrid, RestGridModel, RestStore} from 'hoist/rest';
import {boolCheckCol, baseCol} from 'hoist/columns/Core';
import {dateCol} from 'hoist/columns/DatesTimes';
import {wrapperPanel} from '../impl/WrapperPanel';

@hoistComponent()
export class RestGridPanel extends Component {

    store = new RestStore({
        url: '/desktop/tabs/grids/impl/data/companyRegistry',
        fields: [
            {
                name: 'company',
                required: true
            },
            {
                name: 'joined_date',
                type: 'date',
                required: true
            },
            {
                name: 'isActive',
                type: 'bool',
                defaultValue: false
            }
        ]
    });

    gridModel = new RestGridModel({
        store: this.store,
        sortBy: 'company',
        filterFields: ['company'],
        actionWarning: {
            edit: 'Are you sure you want to edit? Editing preferences can break running apps!',
            del: 'Are you sure you want to delete? Deleting preferences can break running apps!'
        },
        columns: [
            baseCol({field: 'company'}),
            dateCol({field: 'joined_date', fixedWidth: 150}),
            boolCheckCol({field: 'isActive', fixedWidth: 100})
        ],
        editors: [
            {field: 'company'},
            {field: 'joined_date'},
            {field: 'isActive', type: 'boolSelect'}
        ]
    });

    render() {
        return wrapperPanel(
            panel({
                cls: 'xh-toolbox-restgrid-panel',
                title: 'Rest Grid',
                width: 600,
                height: 400,
                item: this.renderExample()
            })
        );
    }

    renderExample() {
        const model = this.gridModel;
        return vframe({
            cls: 'xh-toolbox-example-container',
            item: restGrid({model})
        });
    }
}