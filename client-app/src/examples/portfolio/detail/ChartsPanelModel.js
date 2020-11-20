import {HoistModel, loadAllAsync, managed} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {LineChartModel} from './LineChartModel';
import {OHLCChartModel} from './OHLCChartModel';

export class ChartsPanelModel extends HoistModel  {

    get isLoadSupport() {return true}

    @bindable symbol = null;

    @managed lineChartModel = new LineChartModel();
    @managed ohlcChartModel = new OHLCChartModel();

    constructor() {
        super();
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