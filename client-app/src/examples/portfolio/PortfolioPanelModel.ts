import {HoistModel, managed, XH} from '@xh/hoist/core';
import {Store} from '@xh/hoist/data';
import {GridPanelModel} from './GridPanelModel';
import {round} from 'lodash';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {PERSIST_MAIN} from './AppModel';
import {waitFor} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';

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
        const wsService = XH.webSocketService;
        this.addReaction({
            track: () => [this.groupingChooserModel.value, wsService.connected],
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec) {
        const wsService = XH.webSocketService,
            {store, groupingChooserModel, gridPanelModel} = this,
            dims = groupingChooserModel.value;

        let {session} = this;
        session?.destroy();

        // Wait for WS for streaming updates feature, but not strictly needed to show data
        await waitFor(() => wsService.connected, 50, 5 * SECONDS).catch(() =>
            this.logError('WebSocket service failed to connect')
        );
        if (loadSpec.isStale) return;

        session = await XH.portfolioService.getLivePositionsAsync(dims, 'mainApp').catchDefault();

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
            processRawData: r => {
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
