import {HoistModel, managed, TaskObserver, XH} from '@xh/hoist/core';
import {Store} from '@xh/hoist/data';
import {bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {logInfo} from '@xh/hoist/utils/js';
import {GridPanelModel} from './GridPanelModel';
import {isNil, round} from 'lodash';
import {GroupingChooserModel} from '@xh/hoist/cmp/grouping';
import {wait, waitFor} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {DetailPanelModel} from './detail/DetailPanelModel';
import {PersistenceManagerModel} from '@xh/hoist/core/persist/persistenceManager';
import {AppModel} from './AppModel';

export class PortfolioPanelModel extends HoistModel {
    @managed session;

    @managed @observable.ref persistenceManagerModel: PersistenceManagerModel =
        AppModel.instance.persistenceManagerModel;
    @managed groupingChooserModel: GroupingChooserModel;
    @managed store = this.createStore();
    @managed gridPanelModel: GridPanelModel;
    @managed detailPanelModel: DetailPanelModel;

    @bindable.ref initError: Error;

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
        const wsService = XH.webSocketService;

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
        this.addReaction({
            track: () => this.persistenceManagerModel.value,
            run: value => this.onViewChangeAsync(value)
        });
    }

    override async doLoadAsync(loadSpec) {
        if (!this.groupingChooserModel) return;

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
        const {persistenceManagerModel} = this;
        return new GroupingChooserModel({
            dimensions: ['fund', 'model', 'region', 'sector', 'symbol', 'trader'],
            initialValue: ['region', 'sector', 'symbol'],
            persistWith: {persistenceManagerModel},
            allowEmpty: true
        });
    }

    private createGridPanelModel() {
        const {persistenceManagerModel} = this;
        return new GridPanelModel({
            persistWith: {persistenceManagerModel},
            parentModel: this
        });
    }

    private createDetailPanelModel() {
        const {persistenceManagerModel} = this;
        return new DetailPanelModel({
            persistWith: {persistenceManagerModel},
            parentModel: this
        });
    }

    private async onViewChangeAsync(value) {
        if (!this.groupingChooserModel) return;

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
