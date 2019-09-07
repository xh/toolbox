import React from 'react';
import {hoistCmp, HoistModel, LoadSupport, managed, XH, useModel, localModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {storeFilterField} from '@xh/hoist/desktop/cmp/store';
import {dataView, DataViewModel} from '@xh/hoist/desktop/cmp/dataview';

import {wrapper} from '../../common/Wrapper';
import {dataViewItem} from './DataViewItem';
import './DataViewItem.scss';
import {shuffle, take} from 'lodash';

export const DataViewPanel = hoistCmp({
    model: localModel(() => new Model()),

    render()  {
        const model = useModel();

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
                bbar: [
                    refreshButton({
                        text: 'Load new (random) records',
                        model
                    }),
                    filler(),
                    storeFilterField({store: model.dataViewModel.store})
                ]
            })
        });
    }
});

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