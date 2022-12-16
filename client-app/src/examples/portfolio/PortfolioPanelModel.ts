import {HoistModel, managed,XH} from '@xh/hoist/core';
import {Store} from '@xh/hoist/data';
import {GridPanelModel} from './GridPanelModel';
import {round} from 'lodash';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {PERSIST_MAIN} from './AppModel';

export class PortfolioPanelModel extends HoistModel {

    @managed session;

    @managed groupingChooserModel = this.createGroupingChooserModel();
    @managed store = this.createStore();
    @managed gridPanelModel = new GridPanelModel({parentModel: this});

    get selectedPosition() {
        return this.gridPanelModel.selectedRecord;
    }

    constructor() {
        super();
        this.addReaction({
            track: () => this.groupingChooserModel.value,
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec) {
        const {store, groupingChooserModel, gridPanelModel} = this,
            dims = groupingChooserModel.value;

        let {session} = this;
        session?.destroy();

        session = await XH.portfolioService
            .getLivePositionsAsync(dims, 'mainApp')
            .catchDefault();

        store.loadData([session.initialPositions.root]);
        session.onUpdate = ({data}) => {
            gridPanelModel.loadTimestamp = Date.now();
            store.updateData(data);
        };

        this.session = session;

        await gridPanelModel.gridModel.preSelectFirstAsync();
    }

    //------------------------
    // Implementation
    //------------------------
    private createStore() {
        return new Store({
            processRawData: (r) => {
                return {
                    pnlMktVal: round(r.pnl / Math.abs(r.mktVal), 2),
                    ...r
                };
            },
            fields: [
                {name: 'name', type: 'string'},
                {name: 'mktVal', type: 'number'},
                {name: 'pnl', type: 'number', displayName: 'P&L'},
                {name: 'pnlMktVal', type: 'number', displayName: 'P&L / Mkt Val'}
            ],
            loadRootAsSummary: true
        });
    }

    private createGroupingChooserModel() {
        return new GroupingChooserModel({
            dimensions: ['fund', 'model', 'region', 'sector', 'symbol', 'trader'],
            initialValue: ['region', 'sector', 'symbol'],
            persistWith: PERSIST_MAIN
        });
    }
}
