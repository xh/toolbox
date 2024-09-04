import {HoistModel, managed, XH} from '@xh/hoist/core';
import {Store} from '@xh/hoist/data';
import {logInfo} from '@xh/hoist/utils/js';
import {GridPanelModel} from './GridPanelModel';
import {round} from 'lodash';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {wait, waitFor} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {PersistenceManagerModel} from '@xh/hoist/desktop/cmp/persistenceManager';
import {DetailPanelModel} from './detail/DetailPanelModel';
import {runInAction} from '@xh/hoist/mobx';

export class PortfolioPanelModel extends HoistModel {
    @managed session;

    @managed persistenceManagerModel: PersistenceManagerModel;
    @managed groupingChooserModel: GroupingChooserModel;
    @managed store = this.createStore();
    @managed gridPanelModel: GridPanelModel;
    @managed detailPanelModel: DetailPanelModel;

    get prefKey(): string {
        return 'portfolioExample';
    }

    get selectedPosition() {
        return this.gridPanelModel.selectedRecord;
    }

    constructor() {
        super();
        const wsService = XH.webSocketService;

        this.persistenceManagerModel = new PersistenceManagerModel({
            type: 'portfoioExample',
            noun: 'portfoio',
            canManageGlobal: () => XH.getUser().hasRole('HOIST_ADMIN'),
            onChangeAsync: () => this.onViewChangeAsync(),
            newObjectFnAsync: async () => ({
                portfolioAppGridState: {},
                portfolioAppDetailState: {},
                groupingChooser: {value: ['region', 'sector', 'symbol'], favorites: []}
            }),
            persistWith: {prefKey: this.prefKey}
        });

        this.groupingChooserModel = this.createGroupingChooserModel();
        this.detailPanelModel = this.createDetailPanelModel();
        this.gridPanelModel = this.createGridPanelModel();

        this.addReaction({
            track: () => [this.groupingChooserModel.value, wsService.connected],
            run: () => this.loadAsync()
        });
        this.addReaction({
            track: () => this.selectedPosition,
            run: position => {
                this.detailPanelModel.positionId = position?.id ?? null;
            },
            debounce: 300
        });
    }

    override async doLoadAsync(loadSpec) {
        const wsService = XH.webSocketService,
            {store, gridPanelModel} = this;

        let {session} = this;
        session?.destroy();

        // Wait for WS for streaming updates feature, but not strictly needed to show data
        await waitFor(() => wsService.connected, 50, 5 * SECONDS).catch(() =>
            this.logError('WebSocket service failed to connect')
        );
        if (loadSpec.isStale) return;

        const dims = this.persistenceManagerModel.provider.getData().groupingChooser?.value;
        if (!dims) return;

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
            persistWith: {...this.persistenceManagerModel.provider},
            allowEmpty: true
        });
    }

    private createGridPanelModel() {
        return new GridPanelModel({
            persistWith: this.persistenceManagerModel.provider,
            parentModel: this
        });
    }

    private createDetailPanelModel() {
        return new DetailPanelModel({
            persistWith: this.persistenceManagerModel.provider,
            parentModel: this
        });
    }

    private async onViewChangeAsync() {
        const start = Date.now();

        await wait(); // allow masking to start

        const {persistenceManagerModel, gridPanelModel, detailPanelModel, groupingChooserModel} =
                this,
            newState = persistenceManagerModel.provider.getData();
        groupingChooserModel.setValue(newState.groupingChooser?.value ?? []);
        gridPanelModel.updateState(newState);

        runInAction(() => {
            const detailPm = detailPanelModel.ordersPanelModel.gridModel.persistenceModel;
            detailPm.state = newState.portfolioAppDetailState;
            detailPm.updateGridColumns();
            detailPm.updateGridSort();
        });

        logInfo(`Rebuilt view | took ${Date.now() - start}ms`, this);
    }
}
