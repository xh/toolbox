import {hoistCmp, HoistModel, LoadSupport, managed, XH, creates} from '@xh/hoist/core';
import {label, p, span, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dataView, DataViewModel} from '@xh/hoist/cmp/dataview';

import {shuffle, take} from 'lodash';
import {slider} from '@xh/hoist/desktop/cmp/input';
import './DataViewResizingTestPanel.scss';

export const dataViewResizingTestPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model})  {
        return panel({
            className: 'dataview-resizing-test xh-tiled-bg',
            title: 'Data View Resizing',
            items: [
                p('It should be possible to dynamically resize the rows of a DataView.'),
                dataView({
                    model: model.dataViewModel
                })
            ],
            bbar: [
                label('itemHeight'),
                slider({bind: 'itemHeight', model: model.dataViewModel, min: 0, max: 100, labelStepSize: 20}),
                label('groupRowHeight'),
                slider({bind: 'groupRowHeight', model: model.dataViewModel, min: 0, max: 100, labelStepSize: 20})
            ]
        });
    }
});

@HoistModel
@LoadSupport
class Model {

    @managed
    dataViewModel = new DataViewModel({
        store: {
            fields: ['company', 'city']
        },
        elementRenderer: (v, {record}) => vbox(
            span(record.data.company),
            span(record.data.city)
        ),
        itemHeight: 70,
        stripeRows: true,
        groupBy: 'city',
        groupRowHeight: 25
    });

    async doLoadAsync(loadSpec) {
        const {dataViewModel} = this,
            allCustomers = await XH.fetchJson({url: 'customer'}),
            customers = take(shuffle(allCustomers), 100);

        await dataViewModel.store.loadData(customers);
    }
}