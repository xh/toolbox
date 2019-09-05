import {filler} from '@xh/hoist/cmp/layout';
import {HoistComponent, HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dataView, DataViewModel} from '@xh/hoist/desktop/cmp/dataview';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {shuffle, take} from 'lodash';
import React, {Component} from 'react';
import {wrapper} from '../../common/Wrapper';
import {dataViewItem} from './DataViewItem';
import './DataViewItem.scss';

@HoistComponent
export class DataViewPanel extends Component {

    model = new Model();

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
                title: 'Grids › DataView',
                icon: Icon.addressCard(),
                width: 700,
                height: 400,
                item: dataView({
                    model: model.dataViewModel,
                    rowCls: 'dataview-item',
                    itemHeight: 70
                }),
                bbar: toolbar(
                    refreshButton({
                        text: 'Load new (random) records',
                        model
                    }),
                    filler(),
                    storeFilterField({store: model.dataViewModel.store})
                )
            })
        });
    }
}

@HoistModel
@LoadSupport
class Model {

    @managed
    dataViewModel = new DataViewModel({
        store: {
            fields: ['name', 'city', 'value']
        },
        sortBy: {colId: 'name', sort: 'asc'},
        emptyText: 'No companies found...',
        itemRenderer: (v, {record}) => dataViewItem({record})
    });
    
    async doLoadAsync(loadSpec) {
        const {dataViewModel} = this,
            allCustomers = await XH.fetchJson({url: 'customer'}),
            customers = take(shuffle(allCustomers), 100);

        const min = -1000,
            max = 1000;

        await dataViewModel.store.loadData(customers.map(it => {
            const randVal = Math.random() * (max - min) + min;
            return {
                id: it.id,
                name: it.company,
                city: it.city,
                value: randVal
            };
        }));

        dataViewModel.selectFirst();
    }
}