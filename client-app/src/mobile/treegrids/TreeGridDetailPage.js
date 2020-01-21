import {hoistCmp, HoistModel, LoadSupport, useLocalModel, XH} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {numberRenderer} from '@xh/hoist/format';
import {capitalize} from 'lodash';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';

export const treeGridDetailPage = hoistCmp.factory({
    render({id}) {
        const impl = useLocalModel(LocalModel);
        impl.setId(decodeURIComponent(id));
        const {record} = impl;
        
        return page({
            title: record ? renderPageTitle(record) : null,
            icon: Icon.portfolio(),
            mask: impl.loadModel,
            className: 'toolbox-detail-page',
            item: record ? renderRecord(record) : null
        });
    }
});

function renderPageTitle(record) {
    const lastPart = record.id.split('>>').pop();
    return lastPart.split(':').pop();
}

function renderRecord(record) {
    return div(
        // Split id to extract drilldown information
        ...record.id.split('>>').map(it => {
            if (it === 'root') return null;
            const parts = it.split(':');
            return renderRow(capitalize(parts[0]), parts[1]);
        }),

        renderRow('Market Value', record.data.mktVal, numberRenderer({precision: 0, ledger: true, asElement: true})),
        renderRow('P&L', record.data.pnl, numberRenderer({precision: 0, ledger: true, colorSpec: true, asElement: true}))
    );
}

function renderRow(title, value, renderer) {
    return div({
        className: 'toolbox-detail-row',
        items: [
            div(title),
            div(renderer ? renderer(value) : value)
        ]
    });
}

@LoadSupport
@HoistModel
class LocalModel {

    @bindable id;
    @bindable.ref record;

    constructor() {
        this.addReaction({
            track: () => this.id,
            run: () => this.loadAsync()
        });
    }

    async doLoadAsync(loadSpec) {
        const record = await (this.id ? XH.portfolioService.getPositionAsync(this.id) : null);
        this.setRecord(record);
    }
}
