/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {dataView, DataViewModel} from '@xh/hoist/desktop/cmp/dataview';
import {LocalStore} from '@xh/hoist/data';

import {App} from '../../App';
import {wrapper} from '../../common/Wrapper';
import {dataViewItem} from './DataViewItem';
import './DataViewItem.scss';

@HoistComponent
export class DataViewPanel extends Component {

    localModel = new DataViewModel({
        store: new LocalStore({
            fields: ['id', 'name', 'city', 'value']
        }),
        itemRenderer: (v, {record}) => dataViewItem({record})
    });

    render() {
        const {model} = this;

        return wrapper({
            description: [
                <p>
                    The DataView component leverages an underlying Grid / GridModel instance to
                    display individual component "cards" for each rendered item.
                </p>
            ],
            item: panel({
                className: 'toolbox-dataview-panel',
                title: 'Grids > DataView',
                icon: Icon.addressCard(),
                width: 700,
                height: 400,
                item: dataView({
                    model,
                    rowCls: 'dataview-item',
                    itemHeight: 70
                }),
                bbar: toolbar({
                    items: [
                        storeFilterField({store: model.store}),
                        filler(),
                        button({
                            text: 'Reload Data',
                            icon: Icon.refresh(),
                            onClick: this.loadData
                        })
                    ]
                })
            })
        });
    }

    componentDidMount() {
        this.loadData();
    }

    loadData = () => {
        const {store} = this.model,
            companies = App.companyService.randomCompanies,
            min = -1000,
            max = 1000;

        store.loadData(companies.map(it => {
            const randVal = Math.random() * (max - min) + min;
            return {
                name: it.name,
                city: it.city,
                value: randVal
            };
        }));
    }
}