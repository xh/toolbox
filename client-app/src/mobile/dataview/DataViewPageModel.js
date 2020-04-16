import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {shuffle, take} from 'lodash';
import {dataViewItem} from './DataViewItem';

@HoistModel
@LoadSupport
export class DataViewPageModel {

    @managed
    dataViewModel = new DataViewModel({
        store: {
            fields: ['name', 'city', 'value']
        },
        sortBy: 'name',
        emptyText: 'No companies found...',
        elementRenderer: (v, {record}) => dataViewItem({record}),
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
    }
}