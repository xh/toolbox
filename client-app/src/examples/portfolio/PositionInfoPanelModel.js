import {HoistModel, LoadSupport} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {managed} from '@xh/hoist/core';
import {OrdersPanelModel} from './OrdersPanelModel';
import {ChartsPanelModel} from './ChartsPanelModel';
import {loadAllAsync} from '@xh/hoist/core';

@HoistModel
@LoadSupport
export class PositionInfoPanelModel {
    @bindable positionId = '';

    @managed ordersPanelModel = new OrdersPanelModel();
    @managed chartsPanelModel = new ChartsPanelModel();

    constructor() {
        this.addReaction({
            track: () => this.positionId,
            run: (positionId) => {
                this.ordersPanelModel.setPositionId(positionId);
            }
        });
        this.addReaction({
            track: () => this.ordersPanelModel.selectedRecord,
            run: (order) => {
                const symbol = order ? order.symbol : '';
                this.chartsPanelModel.setSymbol(symbol);
            }
        });
    }

    async doLoadAsync(loadSpec) {
        await loadAllAsync([
            this.ordersPanelModel,
            this.chartsPanelModel
        ], loadSpec);
    }
}