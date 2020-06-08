import {HoistModel, loadAllAsync, LoadSupport, managed} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {OrdersPanelModel} from './OrdersPanelModel';
import {ChartsPanelModel} from './ChartsPanelModel';

@HoistModel
@LoadSupport
export class DetailPanelModel {
    @bindable positionId = null;

    static persistWith = {localStorageKey: 'portfolioDetailState'};

    @managed ordersPanelModel = new OrdersPanelModel();
    @managed chartsPanelModel = new ChartsPanelModel();

    @managed panelSizingModel = new PanelModel({
        defaultSize: 400,
        minSize: 250,
        maxSize: 500,
        side: 'bottom',
        renderMode: 'unmountOnHide',
        persistWith: this.persistWith
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
                const symbol = order ? order.data.symbol : null;
                chartsPanelModel.setSymbol(symbol);
            }
        });
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
