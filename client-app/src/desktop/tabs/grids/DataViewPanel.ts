import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler, p} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {refreshButton} from '@xh/hoist/desktop/cmp/button';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {dataView, DataViewModel} from '@xh/hoist/cmp/dataview';
import {wrapper} from '../../common';
import {dataViewItem} from './DataViewItem';
import {shuffle, take} from 'lodash';

export const dataViewPanel = hoistCmp.factory({
    model: creates(() => DataViewPanelModel),

    render({model}) {
        return wrapper({
            title: 'DataView',
            icon: Icon.addressCard(),
            description: [
                p(
                    'DataView renders each store record as a custom "card" component rather than a row of columns, making it a good fit for richer, non-tabular layouts. It is backed by a Grid and GridModel under the hood, so it inherits grid features such as sorting, selection, and store binding while leaving the rendering of each item entirely up to the application.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/DataViewPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/dataview/DataView.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/dataview/DataViewModel.ts',
                    notes: 'Hoist model for configuring and interacting with DataViews.'
                }
            ],
            item: panel({
                className: 'tb-dataview-panel',
                width: 600,
                height: '50vh',
                item: dataView(),
                bbar: [
                    refreshButton({
                        text: 'Load new (random) records',
                        target: model
                    }),
                    filler(),
                    storeFilterField({store: model.dataViewModel.store})
                ]
            })
        });
    }
});

class DataViewPanelModel extends HoistModel {
    @managed
    dataViewModel = new DataViewModel({
        store: {
            fields: [
                {name: 'name', type: 'string'},
                {name: 'city', type: 'string'},
                {name: 'value', type: 'number'}
            ]
        },
        sortBy: 'name',
        emptyText: 'No companies found...',
        renderer: (v, {record}) => dataViewItem({record}),
        itemHeight: 70,
        rowClassFn: () => 'dataview-item',
        stripeRows: true
    });

    override async doLoadAsync(loadSpec) {
        const {dataViewModel} = this,
            allCustomers = await XH.fetchJson({url: 'customer'}),
            customers = take(shuffle(allCustomers), 100);

        const min = -1000,
            max = 1000;

        await dataViewModel.loadData(
            customers.map(it => {
                const randVal = Math.random() * (max - min) + min;
                return {
                    id: it.id,
                    name: it.company,
                    city: it.city,
                    value: randVal
                };
            })
        );

        await dataViewModel.selectFirstAsync();
    }
}
