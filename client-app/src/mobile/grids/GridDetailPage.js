import {hoistCmp, HoistModel, useLocalModel, XH} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {numberRenderer} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {find, isNil} from 'lodash';
import {bindable, observable, makeObservable} from '@xh/hoist/mobx';

export const gridDetailPage = hoistCmp.factory({
    render({id}) {
        const impl = useLocalModel(LocalModel);
        impl.setId(id);
        const {record} = impl;

        const row = (title, value, renderer) => div({
            className: 'toolbox-detail-row',
            items: [
                div(title),
                div(renderer && !isNil(value) ? renderer(value) : value)
            ]
        });

        return panel({
            title: record?.company ?? '',
            mask: impl.loadModel,
            icon: Icon.fund(),
            className: 'toolbox-detail-page',
            items: [
                row('ID', record?.id),
                row('Company', record?.company),
                row('City', record?.city),
                row('P&L', record?.profit_loss, numberRenderer({precision: 0, ledger: true, colorSpec: true, asElement: true})),
                row('Volume', record?.trade_volume, numberRenderer({precision: 0, asElement: true}))
            ]
        });
    }
});

class LocalModel extends HoistModel {

    @bindable id = null;
    @observable.ref record = null;
    @bindable.ref customers = null;

    constructor() {
        super();
        makeObservable(this);
        this.addReaction({
            track: () => [this.customers, this.id],
            run: ([customers, id]) => {
                if (customers && id) {
                    this.record = find(customers, {id: parseInt(id)});
                }
            }
        });
    }

    async doLoadAsync() {
        this.setCustomers(await XH.fetchJson({url: 'customer'}));
    }
}

