import {HoistModel, loadAllAsync, LoadSupport} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {managed} from '@xh/hoist/core';
import {LineChartModel} from './LineChartModel';
import {OHLCChartModel} from './OHLCChartModel';

@HoistModel
@LoadSupport
export class ChartsPanelModel {

    @bindable symbol = null;

    @managed lineChartModel = new LineChartModel();
    @managed ohlcChartModel = new OHLCChartModel();

    constructor() {
        this.addReaction({
            track: () => this.symbol,
            run: (symbol) => {
                this.lineChartModel.setSymbol(symbol);
                this.ohlcChartModel.setSymbol(symbol);
            },
            debounce: 500
        });
    }

    async doLoadAsync(loadSpec) {
        await loadAllAsync([
            this.lineChartModel,
            this.ohlcChartModel
        ], loadSpec);
    }
}