/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {wrapper} from '../impl/Wrapper';
import {vframe} from '@xh/hoist/cmp/layout/index';
import {panel} from '@xh/hoist/desktop/cmp/panel/index';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar/index';
import {dataView, DataViewModel} from '@xh/hoist/desktop/cmp/dataview/index';
import {LocalStore} from '@xh/hoist/data/index';
import {dataViewItem} from '../components/impl/DataViewItem';
import './DataViewItem.scss';

@HoistComponent()
export class DataViewPanel extends Component {
    localModel = new DataViewModel({
        emptyText: 'No Data Loaded',
        store: new LocalStore({
            fields: ['id', 'name', 'value', 'status']
        }),
        itemFactory: dataViewItem
    });

    render() {
        return wrapper({
            item: panel({
                cls: 'toolbox-dataview-panel',
                title: 'DataView Component',
                width: 600,
                height: 400,
                item: this.renderExample(),
                bbar: toolbar(
                    button({text: 'Load', onClick: this.loadData})
                )
            })
        });
    }

    renderExample() {
        const {model} = this;

        return vframe({
            cls: 'toolbox-example-container',
            item: dataView({
                model,
                rowCls: 'dataview-item',
                itemHeight: 75
            })
        });
    }

    loadData = () => {
        const {store} = this.model,
            companies = ['Google', 'Amazon', 'Facebook', 'Yahoo'],
            min = 0, max = 100;

        store.loadData(companies.map((company, idx) => ({
            id: idx,
            name: company,
            value: (Math.random() * (max - min) + min).toFixed(2),
            status: Math.round(Math.random()) ? 'success' : 'error'
        })));
    }
}