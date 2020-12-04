import {HoistModel, LoadSupport, managed, XH} from '@xh/hoist/core';
import {Store} from '@xh/hoist/data';
import {GridPanelModel} from './GridPanelModel';
import {MapPanelModel} from './MapPanelModel';
import {clamp, round} from 'lodash';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {DetailPanelModel} from './detail/DetailPanelModel';
import {PERSIST_MAIN} from './AppModel';

@HoistModel
@LoadSupport
export class PortfolioPanelModel {

    @managed session;

    @managed groupingChooserModel = this.createGroupingChooserModel();
    @managed store = this.createStore();
    @managed gridPanelModel = new GridPanelModel({parentModel: this});
    @managed mapPanelModel = new MapPanelModel({parentModel: this});
    @managed detailPanelModel = new DetailPanelModel();

    get selectedPosition() {
        return this.gridPanelModel.selectedRecord;
    }

    constructor() {
        this.addReaction({
            track: () => this.groupingChooserModel.value,
            run: () => this.loadAsync()
        });

        this.addReaction({
            track: () => this.selectedPosition,
            run: (position) => {
                this.detailPanelModel.setPositionId(position ? position.id : null);
            },
            debounce: 300
        });
    }

    async doLoadAsync(loadSpec) {
        const {store, groupingChooserModel, gridPanelModel} = this,
            dims = groupingChooserModel.value;

        let {session} = this;
        if (session) session.destroy();

        session = await XH.portfolioService
            .getLivePositionsAsync(dims, 'mainApp')
            .catchDefault();

        store.loadData([session.initialPositions.root]);
        session.onUpdate = ({data}) => {
            gridPanelModel.setLoadTimestamp(Date.now());
            store.updateData(data);
        };

        this.session = session;

        if (!this.selectedPosition) {
            gridPanelModel.gridModel.selectFirst();
        }

        await this.detailPanelModel.doLoadAsync();
    }

    //------------------------
    // Implementation
    //------------------------
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
                {name: 'pnl', displayName: 'P&L'},
                {name: 'pnlMktVal', displayName: 'P&L / Mkt Val'}
            ],
            loadRootAsSummary: true
        });
    }

    createGroupingChooserModel() {
        return new GroupingChooserModel({
            dimensions: ['fund', 'model', 'region', 'sector', 'symbol', 'trader'],
            initialValue: ['region', 'sector', 'symbol'],
            persistWith: PERSIST_MAIN
        });
    }
}
