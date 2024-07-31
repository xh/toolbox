import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {find, isNil} from 'lodash';
import {makeObservable, computed, observable} from '@xh/hoist/mobx';

export const gridDetailPage = hoistCmp.factory({
    model: creates(() => GridDetailPageModel),
    render({model}) {
        const {record} = model;

        const row = (title, value, renderer?) =>
            div({
                className: 'tb-detail-row',
                items: [div(title), div(renderer && !isNil(value) ? renderer(value) : value)]
            });

        return panel({
            title: record?.company ?? '',
            mask: 'onLoad',
            icon: Icon.fund(),
            className: 'tb-detail-page',
            items: [
                row('ID', record?.id),
                row('Company', record?.company),
                row('City', record?.city),
                row(
                    'P&L',
                    record?.profit_loss,
                    numberRenderer({precision: 0, ledger: true, colorSpec: true})
                ),
                row('Volume', record?.trade_volume, numberRenderer({precision: 0}))
            ]
        });
    }
});

class GridDetailPageModel extends HoistModel {
    @observable.ref customers = null;

    @computed
    get record() {
        const {id} = this.componentProps,
            {customers} = this;
        return customers && id ? find(customers, {id: parseInt(id)}) : null;
    }

    constructor() {
        super();
        makeObservable(this);
    }

    override async doLoadAsync() {
        await XH.fetchJson({url: 'customer', correlationId: true}).thenAction(
            c => (this.customers = c)
        );
    }
}
