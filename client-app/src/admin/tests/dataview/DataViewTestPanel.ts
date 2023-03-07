import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {label, span, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dataView, DataViewModel} from '@xh/hoist/cmp/dataview';
import {shuffle, take} from 'lodash';
import {slider} from '@xh/hoist/desktop/cmp/input';
import './DataViewTestPanel.scss';

export const dataViewTestPanel = hoistCmp.factory({
    model: creates(() => DataViewTestPanelModel),

    render({model}) {
        const {dataViewModel} = model;
        return panel({
            className: 'dataview-test xh-tiled-bg',
            title: 'Data View',
            items: [dataView({model: dataViewModel})],
            bbar: [
                label('itemHeight'),
                slider({
                    bind: 'itemHeight',
                    model: dataViewModel,
                    min: 0,
                    max: 100,
                    labelStepSize: 20
                }),
                label('groupRowHeight'),
                slider({
                    bind: 'groupRowHeight',
                    model: dataViewModel,
                    min: 0,
                    max: 100,
                    labelStepSize: 20
                })
            ]
        });
    }
});

class DataViewTestPanelModel extends HoistModel {
    @managed
    dataViewModel = new DataViewModel({
        store: {
            fields: ['company', 'city']
        },
        renderer: (v, {record}) => vbox(span(record.data.company), span(record.data.city)),
        itemHeight: 70,
        stripeRows: true,
        groupBy: 'city',
        groupRowHeight: 25
    });

    override async doLoadAsync(loadSpec) {
        const {dataViewModel} = this,
            allCustomers = await XH.fetchJson({url: 'customer'}),
            customers = take(shuffle(allCustomers), 100);

        await dataViewModel.loadData(customers);
    }
}
