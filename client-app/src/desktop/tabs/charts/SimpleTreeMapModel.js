import {XH, HoistModel, managed} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {TreeMapModel} from '@xh/hoist/desktop/cmp/treemap';
import {Store} from '@xh/hoist/data';
import {clamp} from 'lodash';

@HoistModel
@LoadSupport
export class SimpleTreeMapModel {

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
        const data = await XH.portfolioService.getPortfolioAsync(['symbol']);
        this.store.loadData(data);
    }

}