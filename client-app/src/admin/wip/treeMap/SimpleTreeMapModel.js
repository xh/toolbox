import {XH, HoistModel, managed} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {TreeMapModel} from '@xh/hoist/desktop/cmp/treemap';
import {Store} from '@xh/hoist/data';

@HoistModel
@LoadSupport
export class SimpleTreeMapModel {

    @managed
    store = new Store({
        fields: ['name', 'pnl', 'mktVal']
    });

    @managed
    treeMapModel = new TreeMapModel({
        store: this.store,
        labelField: 'name',
        valueField: 'pnl',
        heatField: 'mktVal',
        valueFieldLabel: 'Pnl',
        heatFieldLabel: 'Market Value'
    });

    async doLoadAsync() {
        const data = await XH.portfolioService.getPortfolioAsync(['symbol']);
        this.store.loadData(data);
    }

}