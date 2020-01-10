import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {Store} from '@xh/hoist/data';
import {GridPanelModel} from './GridPanelModel';
import {MapPanelModel} from './MapPanelModel';
import {clamp, round} from 'lodash';
import {DimensionChooserModel} from '@xh/hoist/cmp/dimensionchooser';
import {DetailPanelModel} from './detail/DetailPanelModel';

@HoistModel
@LoadSupport
export class PortfolioPanelModel {

    @managed session;

    @managed dimChooserModel = this.createDimChooserModel();
    @managed store = this.createStore();
    @managed gridPanelModel = new GridPanelModel({parentModel: this});
    @managed mapPanelModel = new MapPanelModel({parentModel: this});
    @managed detailPanelModel = new DetailPanelModel();

    get selectedPosition() {
        return this.gridPanelModel.selectedRecord;
    }

    constructor() {
        this.addReaction(this.selectedPositionReaction());
        this.addReaction(this.dimensionChooserReaction());
    }

    async doLoadAsync(loadSpec) {
        const {store, dimChooserModel, gridPanelModel} = this,
            dims = dimChooserModel.value;

        let {session} = this;
        if (session) session.destroy();
        session = await XH.portfolioService.getLivePositionsAsync(dims, 'mainApp');

        store.loadData([session.initialPositions.root]);
        session.onUpdate = ({data}) => {
            gridPanelModel.setLoadTimestamp(Date.now());
            store.loadDataUpdates(data);
        };

        this.session = session;

        if (!this.selectedPosition) {
            gridPanelModel.gridModel.selectFirst();
        }

        await this.detailPanelModel.doLoadAsync();
    }

    //----------------------------------------
    // Implementations
    //----------------------------------------
    selectedPositionReaction() {
        return {
            track: () => this.selectedPosition,
            run: (position) => {
                this.detailPanelModel.setPositionId(position ? position.id : null);
            },
            delay: 500
        };
    }

    dimensionChooserReaction() {
        return {
            track: () => this.dimChooserModel.value,
            run: () => this.loadAsync()
        };
    }

    createStore() {
        return new Store({
            processRawData: (r) => {
                const roundedPnlMktVal = round(r.pnl / Math.abs(r.mktVal), 2);
                return {
                    pnlMktVal: clamp(roundedPnlMktVal, -1, 1),
                    ...r
                };
            },
            fields: [
                {name: 'name'},
                {name: 'mktVal'},
                {name: 'pnl', label: 'P&L'},
                {name: 'pnlMktVal', label: 'P&L / Mkt Val'}
            ],
            loadRootAsSummary: true
        });
    }

    createDimChooserModel() {
        return new DimensionChooserModel({
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
    }
}
