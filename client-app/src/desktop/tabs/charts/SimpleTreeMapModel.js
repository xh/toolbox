import {HoistModel, managed, XH} from '@xh/hoist/core';
import {TreeMapModel} from '@xh/hoist/desktop/cmp/treemap';
import {Store} from '@xh/hoist/data';
import {clamp} from 'lodash';

export class SimpleTreeMapModel extends HoistModel {

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
        maxHeat: 1,
        colorMode: 'linear',
        labelField: 'name',
        valueField: 'pnl',
        heatField: 'pnlMktVal'
    });

    async doLoadAsync() {
        const data = await XH.portfolioService.getPositionsAsync(['symbol']);
        this.store.loadData(data);
    }

}