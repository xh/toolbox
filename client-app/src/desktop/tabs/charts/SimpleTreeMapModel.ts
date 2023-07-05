import {HoistModel, managed, XH} from '@xh/hoist/core';
import {TreeMapModel} from '@xh/hoist/desktop/cmp/treemap';
import {Store} from '@xh/hoist/data';

export class SimpleTreeMapModel extends HoistModel {
    @managed
    store = new Store({
        processRawData: r => {
            return {
                pnlMktVal: r.pnl / Math.abs(r.mktVal),
                ...r
            };
        },
        fields: [
            {name: 'name', type: 'string'},
            {name: 'pnl', type: 'number', displayName: 'P&L'},
            {name: 'pnlMktVal', type: 'number', displayName: 'P&L / Mkt Val'}
        ]
    });

    @managed
    treeMapModel = new TreeMapModel({
        store: this.store,
        maxHeat: 1,
        colorMode: 'linear',
        labelField: 'name',
        valueField: 'pnl',
        heatField: 'pnlMktVal'
    });

    override async doLoadAsync() {
        const data = await XH.portfolioService.getPositionsAsync(['symbol']);
        this.store.loadData(data);
    }
}
