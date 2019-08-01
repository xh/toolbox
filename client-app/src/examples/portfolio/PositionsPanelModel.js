import {HoistModel, XH, managed, LoadSupport} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {DimensionChooserModel} from '@xh/hoist/desktop/cmp/dimensionchooser';

@HoistModel
@LoadSupport
export class PositionsPanelModel {

    @bindable loadTimestamp;

    @managed
    dimChooserModel = new DimensionChooserModel({
        dimensions: [
            {value: 'fund', label: 'Fund'},
            {value: 'model', label: 'Model'},
            {value: 'region', label: 'Region'},
            {value: 'sector', label: 'Sector'},
            {value: 'symbol', label: 'Symbol'},
            {value: 'trader', label: 'Trader'}
        ],
        preference: 'portfolioDims'
    });

    get selectedRecord() {
        return this.gridModel.selectedRecord;
    }

    constructor({gridModel}) {
        this.gridModel = gridModel;
        this.addReaction({
            track: () => this.dimChooserModel.value,
            run: () => this.loadAsync()
        });
    }

    async doLoadAsync(loadSpec) {
        const {gridModel, dimChooserModel} = this,
            dims = dimChooserModel.value;

        return XH.portfolioService
            .getPortfolioAsync(dims)
            .then(portfolio => {
                gridModel.loadData(portfolio);
                if (!gridModel.selectedRecord) {
                    gridModel.selectFirst();
                }
                this.setLoadTimestamp(Date.now());
            })
            .track({
                category: 'Portfolio Viewer',
                message: 'Loaded positions',
                data: {dims},
                loadSpec
            });
    }
}