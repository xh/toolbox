import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {HoistModel, LoadSpec, managed, XH} from '@xh/hoist/core';
import {Store, StoreRecord} from '@xh/hoist/data';
import {waitFor} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {round} from 'lodash';
import {PositionSession} from '../../core/positions/PositionSession';
import {AppModel} from './AppModel';
import {PositionsGridModel} from './grid/PositionsGridModel';
import {PositionsMapModel} from './map/PositionsMapModel';

export class PortfolioModel extends HoistModel {
    override persistWith = {
        viewManagerModel: AppModel.instance.portfolioViewManager
    };

    @managed session: PositionSession;

    @managed groupingChooserModel: GroupingChooserModel;
    @managed store: Store;

    // Sub-component models
    @managed posGridModel: PositionsGridModel;
    @managed posMapModel: PositionsMapModel;

    get selectedPosition(): StoreRecord {
        return this.posGridModel.selectedRecord;
    }

    constructor() {
        super();

        this.groupingChooserModel = this.createGroupingChooserModel();
        this.store = this.createStore();

        this.posGridModel = new PositionsGridModel({parentModel: this});
        this.posMapModel = new PositionsMapModel({
            parentModel: this,
            gridModel: this.posGridModel.gridModel
        });

        this.addReaction({
            track: () => [this.groupingChooserModel.value, XH.webSocketService.connected],
            run: () => this.loadAsync()
        });
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const wsService = XH.webSocketService,
            {store, groupingChooserModel, posGridModel} = this,
            dims = groupingChooserModel.value;

        this.session?.destroy();

        // Wait for WS for streaming updates feature, but not strictly needed to show data
        await waitFor(() => wsService.connected, 50, 5 * SECONDS).catch(() =>
            this.logError('WebSocket service failed to connect')
        );
        if (loadSpec.isStale) return;

        try {
            const session = await XH.portfolioService.getLivePositionsAsync(dims, 'mainApp');
            if (loadSpec.isStale) return;

            store.loadData([session.initialPositions.root]);
            session.onUpdate = ({data}) => {
                posGridModel.loadTimestamp = Date.now();
                store.updateData(data);
            };

            this.session = session;
            await posGridModel.gridModel.preSelectFirstAsync();
        } catch (e) {
            XH.handleException(e);
        }
    }

    //------------------------
    // Implementation
    //------------------------
    private createStore() {
        return new Store({
            loadRootAsSummary: true,
            fields: [
                {name: 'name', type: 'string'},
                {name: 'mktVal', type: 'number'},
                {name: 'pnl', type: 'number', displayName: 'P&L'},
                {name: 'pnlMktVal', type: 'number', displayName: 'P&L / Mkt Val'}
            ],
            processRawData: r => {
                return {
                    pnlMktVal: round(r.pnl / Math.abs(r.mktVal), 2),
                    ...r
                };
            }
        });
    }

    private createGroupingChooserModel() {
        return new GroupingChooserModel({
            dimensions: ['fund', 'model', 'region', 'sector', 'symbol', 'trader'],
            initialValue: ['region', 'sector', 'symbol'],
            persistWith: {...this.persistWith, persistFavorites: false}
        });
    }
}
