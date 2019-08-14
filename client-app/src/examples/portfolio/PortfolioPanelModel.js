import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {Store} from '@xh/hoist/data';
import {GridPanelModel} from './GridPanelModel';
import {MapPanelModel} from './MapPanelModel';
import {DetailPanelModel} from './detail/DetailPanelModel';
import {clamp} from 'lodash';
import {DimensionChooserModel} from '@xh/hoist/cmp/dimensionchooser';


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
        const {store, dimChooserModel} = this,
            dims = dimChooserModel.value;

        if (this.session) this.session.destroy();

        const session = await XH.portfolioService.getLivePositionsAsync(dims, 'mainApp'),
            positions = [session.initialPositions.root];

        session.onUpdate = ({data}) => {
            this.gridPanelModel.setLoadTimestamp(Date.now());
            if (data.isFull) {
                store.loadData(data.positions);
            } else {
                throw XH.exception('Streaming updates not yet implemented on the client');
            }
        };

        this.session = session;

        store.loadData(positions);

        if (!this.selectedPosition) {
            this.gridPanelModel.gridModel.selectFirst();
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
                return {
                    pnlMktVal: clamp(r.pnl / Math.abs(r.mktVal), -1, 1),
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