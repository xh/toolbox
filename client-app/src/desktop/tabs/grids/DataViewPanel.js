import React from 'react';
import {creates, hoistCmp, HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {dataView, DataViewModel} from '@xh/hoist/cmp/dataview';
import {wrapper} from '../../common/Wrapper';
import {dataViewItem} from './DataViewItem';
import {shuffle, take} from 'lodash';

export const dataViewPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model})  {
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
                item: dataView(),
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
        sortBy: 'name',
        emptyText: 'No companies found...',
        elementRenderer: (v, {record}) => dataViewItem({record}),
        contextMenu: [
            'copyCell'
        ],
        itemHeight: 70,
        rowClassFn: () => 'dataview-item',
        stripeRows: true
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