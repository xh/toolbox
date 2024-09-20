import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import {Store} from '@xh/hoist/data';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {logInfo} from '@xh/hoist/utils/js';
import {GridPanelModel} from './GridPanelModel';
import {isNil, round} from 'lodash';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {wait, waitFor} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {PersistenceManagerModel} from '@xh/hoist/desktop/cmp/persistenceManager';
import {DetailPanelModel} from './detail/DetailPanelModel';

export class PortfolioPanelModel extends HoistModel {
    @managed session;

    @managed persistenceManagerModel: PersistenceManagerModel;
    @managed groupingChooserModel: GroupingChooserModel;
    @managed store = this.createStore();
    @managed gridPanelModel: GridPanelModel;
    @managed detailPanelModel: DetailPanelModel;

    @bindable.ref initError: Error;
    @bindable isInitialized: boolean = false;

    initTask = TaskObserver.trackAll();

    get prefKey(): string {
        return 'portfolioExample';
    }

    get selectedPosition() {
        return this.gridPanelModel.selectedRecord;
    }

    constructor() {
        super();
        makeObservable(this);
        this.initAsync();
    }

    async initAsync() {
        return this._initAsync()
            .catch(e => {
                XH.handleException(e, {showAlert: false});
                this.initError = e;
                throw e;
            })
            .linkTo(this.initTask);
    }

    private async _initAsync() {
        const wsService = XH.webSocketService;

        this.persistenceManagerModel = new PersistenceManagerModel({
            entity: {
                name: 'PortfolioExample',
                displayName: 'Portfolio'
            },
            canManageGlobal: () => XH.getUser().hasRole('GLOBAL_VIEW_MANAGER'),
            onChangeAsync: value => this.onViewChangeAsync(value),
            persistWith: {prefKey: this.prefKey},
            enableDefault: true
        });

        await waitFor(
            () => !isNil(this.persistenceManagerModel.lastLoadCompleted),
            50,
            30 * SECONDS
        );

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

        this.isInitialized = true;
        await this.loadAsync();
    }

    override async doLoadAsync(loadSpec) {
        if (!this.isInitialized) return;

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

    private async onViewChangeAsync(value) {
        if (!this.isInitialized) return;

        const start = Date.now();

        await wait(); // allow masking to start

        if (isNil(value)) {
            this.groupingChooserModel.setValue(['region', 'sector', 'symbol']);
            await this.gridPanelModel.clearStateAsync();
            await this.detailPanelModel.clearStateAsync();
            return;
        }

        const {gridPanelModel, detailPanelModel, groupingChooserModel} = this;
        groupingChooserModel.setValue(value.groupingChooser?.value ?? []);
        gridPanelModel.updateState(value);
        detailPanelModel.updateState(value);

        logInfo(`Rebuilt view | took ${Date.now() - start}ms`, this);
    }
}
