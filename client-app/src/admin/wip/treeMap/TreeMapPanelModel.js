import {XH, HoistModel, managed} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {TreeMapModel} from '@xh/hoist/desktop/cmp/treemap';

@HoistModel
@LoadSupport
export class TreeMapPanelModel {

    @managed
    treeMapModel = new TreeMapModel();

    async doLoadAsync() {
        return XH.portfolioService
            .getPortfolioAsync(['sector', 'symbol'])
            .then(data => {
                console.log(data);
                this.treeMapModel.setData(this.processDataRecursive(data));
            });
    }

    processDataRecursive(data, parentId = null, ret = []) {
        data.forEach(it => {
            const {id, name, pnl, children} = it,
                item = {id, name, value: pnl};

            if (children) {
                this.processDataRecursive(children, id, ret);
            }

            if (parentId) {
                item.parent = parentId;
            }

            ret.push(item);
        });
        return ret;
    }

}