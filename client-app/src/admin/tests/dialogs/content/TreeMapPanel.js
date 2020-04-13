import {XH, HoistModel, managed, hoistCmp, creates, LoadSupport} from '@xh/hoist/core';
import {treeMap} from '@xh/hoist/desktop/cmp/treemap';
import {TreeMapModel} from '@xh/hoist/desktop/cmp/treemap';
import {Store} from '@xh/hoist/data';
import {clamp} from 'lodash';

export const treeMapPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render() {
        return treeMap({minWidth: 200, minHeight: 200});
    }
});

@HoistModel
@LoadSupport
class Model {

    @managed
    store = new Store({
        processRawData: (r) => {
            return {
                pnlMktVal: clamp(r.pnl / Math.abs(r.mktVal), -1, 1),
                ...r
            };
        },
        fields: [
            'name',
            {name: 'pnl', label: 'P&L'},
            {name: 'pnlMktVal', label: 'P&L / Mkt Val'}
        ]
    });

    @managed
    treeMapModel = new TreeMapModel({
        store: this.store,
        colorMode: 'balanced',
        labelField: 'name',
        valueField: 'pnl',
        heatField: 'pnlMktVal'
    });

    async doLoadAsync() {
        const data = await XH.portfolioService.getPositionsAsync(['symbol']);
        this.store.loadData(data);
    }
}