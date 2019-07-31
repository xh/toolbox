import {HoistModel, LoadSupport} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {managed} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {OrdersPanelModel} from './OrdersPanelModel';
import {ChartsPanelModel} from './ChartsPanelModel';
import {loadAllAsync} from '@xh/hoist/core';

@HoistModel
@LoadSupport
export class PositionInfoPanelModel {
    @bindable positionId = null;

    @managed ordersPanelModel = new OrdersPanelModel();
    @managed chartsPanelModel = new ChartsPanelModel();

    @managed panelSizingModel = new PanelModel({
        defaultSize: 400,
        side: 'bottom',
        collapsedRenderMode: 'unmountOnHide'
    });

    constructor() {
        const {chartsPanelModel, ordersPanelModel, panelSizingModel} = this;
        this.addReaction({
            track: () => [this.positionId, panelSizingModel.collapsed],
            run: () => {
                if (!panelSizingModel.collapsed) {
                    ordersPanelModel.setPositionId(this.positionId);
                }
            }
        });
        this.addReaction({
            track: () => ordersPanelModel.selectedRecord,
            run: (order) => {
                const symbol = order ? order.symbol : null;
                chartsPanelModel.setSymbol(symbol);
            }
        });
    }

    get isResizing() {
        return this.panelSizingModel.isResizing;
    }

    async doLoadAsync(loadSpec) {
        if (!this.panelSizingModel.collapsed) {
            await loadAllAsync([
                this.ordersPanelModel,
                this.chartsPanelModel
            ], loadSpec);
        }
    }
}