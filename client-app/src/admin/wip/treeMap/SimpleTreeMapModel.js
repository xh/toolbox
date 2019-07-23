import {XH, HoistModel, managed} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {TreeMapModel} from '@xh/hoist/desktop/cmp/treemap';

@HoistModel
@LoadSupport
export class SimpleTreeMapModel {

    @managed
    treeMapModel = new TreeMapModel({
        labelField: 'name',
        valueField: 'pnl',
        heatField: 'mktVal',
        valueFieldLabel: 'Pnl',
        heatFieldLabel: 'Market Value'
    });

    async doLoadAsync() {
        const data = await XH.portfolioService.getPortfolioAsync(['symbol']);
        this.treeMapModel.setData(data);
    }

}