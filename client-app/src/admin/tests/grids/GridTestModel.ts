import {HoistModel, managed, persist, PersistOptions, TaskObserver, XH} from '@xh/hoist/core';
import {fragment} from '@xh/hoist/cmp/layout';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {FieldType, StoreConfig} from '@xh/hoist/data';
import {fmtMillions, fmtNumber, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {GridModel, ColumnSpec, GridAutosizeMode} from '@xh/hoist/cmp/grid';
import {random, sample, times} from 'lodash';
import {action, bindable, observable, makeObservable} from '@xh/hoist/mobx';
import {waitFor} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {AppModel} from '../../AppModel';
import {GridTestMetrics} from './GridTestMetrics';

const pnlColumn: ColumnSpec = {
    absSort: true,
    align: 'right',
    renderer: numberRenderer({
        precision: 0,
        ledger: true,
        colorSpec: true,
        tooltip: true
    })
};

const PERSIST_KEY = 'adminGridTest';
export class GridTestModel extends HoistModel {
    /**
     * All settings below are persisted as named configs via ViewManager, allowing a full set of
     * A/B testing parameters to be saved, restored, and shared. Note this replaces the prior
     * localStorage persistence - unsaved tweaks are held as pending changes by the ViewManager
     * and survive a reload (via sessionStorage), while named configs live on the server.
     */
    override persistWith: PersistOptions = {
        viewManagerModel: AppModel.instance.gridTestViewManager
    };

    // Total count (approx) of all nodes generated (parents + children).
    @persist
    @bindable
    recordCount = 200000;
    // Number of random records to perturb
    @persist
    @bindable
    twiddleCount = Math.round(this.recordCount * 0.5);
    // Prefix for all IDs - change to ensure no IDs re-used across loads.
    @persist
    @bindable
    idSeed = 1;
    // True to load data in tree structure.
    @bindable tree = false;
    // True to use an incremental numeric id as grid id.
    @persist
    @bindable
    numericId = false;
    // True to show summary row.
    @bindable showSummary = false;
    // True to use tree root node as summary row.
    @persist
    @bindable
    loadRootAsSummary = false;
    // True to enable XSS protection at store level.
    @persist
    @bindable
    enableXssProtection = false;
    // Value > 0 will declare that many additional `extraFieldN` fields on the store to help
    // stress-test stores with a wide array of fields.
    @persist
    @bindable
    extraFieldCount = 50;
    // True to have the server populate the extra fields with generated values (a mix of
    // categorical/unique strings, ints, doubles, bools and nulls) - stress-tests stores with
    // wide *and dense* records, vs. the wide-but-sparse shape produced when off.
    @persist
    @bindable
    populateExtraFields = false;
    // True to enable the Store's `optimizeRecordData` config - for A/B comparison of memory usage
    // and load times. Persisted, and toggling it reloads the app - see the reaction below.
    @persist
    @bindable
    optimizeRecordData = false;

    // True to load from the streaming NDJSON endpoint via Store.loadDataAsync(), vs. standard.
    // For flat loading only.
    @persist
    @bindable
    streamServerLoad = true;

    @persist
    @bindable
    disableSelect = false;

    @persist
    @bindable
    colChooserCommitOnChange = true;

    @persist
    @bindable
    colChooserShowRestoreDefaults = true;

    @persist
    @bindable
    colChooserWidth = null;

    @persist
    @bindable
    colChooserHeight = null;

    @persist
    @bindable
    lockColumnGroups = true;

    @bindable
    @persist
    autosizeMode: GridAutosizeMode = 'onDemand';

    @bindable
    @persist
    renderedRowsOnly = true;

    @bindable
    @persist
    includeCollapsedChildren = true;

    @bindable
    @persist
    includeHiddenColumns = false;

    @bindable
    @persist.with({path: 'gridPersistType', debounce: 500}) // test persist.with!
    persistType = null;

    @managed
    metrics = new GridTestMetrics();

    @managed
    loadTask = TaskObserver.trackLast();

    @managed
    @observable.ref
    gridModel: GridModel;

    /** Saves/restores the settings above as named configs - created by AppModel.initAsync(). */
    get viewManagerModel(): ViewManagerModel {
        return AppModel.instance.gridTestViewManager;
    }

    constructor() {
        super();
        makeObservable(this);
        this.markPersist('tree');
        this.markPersist('showSummary');
        this.gridModel = this.createGridModel();
        this.addReaction({
            track: () => [
                this.tree,
                this.showSummary,
                this.loadRootAsSummary,
                this.disableSelect,
                this.autosizeMode,
                this.renderedRowsOnly,
                this.includeCollapsedChildren,
                this.includeHiddenColumns,
                this.persistType,
                this.colChooserCommitOnChange,
                this.colChooserShowRestoreDefaults,
                this.colChooserWidth,
                this.colChooserHeight,
                this.lockColumnGroups,
                this.enableXssProtection,
                this.extraFieldCount,
                this.populateExtraFields
            ],
            run: () => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
                this.metrics.clear();
            },
            debounce: 100
        });

        this.addReaction({
            track: () => this.recordCount,
            run: () => this.metrics.clear()
        });

        // Reload rather than rebuilding the grid in place. V8 decides an object's property
        // storage per *isolate*, from a transition tree shared across all code in the page: once
        // a given set of keys has been built one way, later objects with those keys can inherit
        // that decision. Measuring both record-data representations in a single session
        // therefore contaminates whichever runs second, in either direction. Each side of an A/B
        // must be measured in a fresh page. This setting and the data-shape settings above are
        // all persisted, so a configured A/B survives the reload intact - see below for the care
        // required when the change arrives via a ViewManager config switch.
        this.addReaction({
            track: () => this.optimizeRecordData,
            run: () => this.reloadForRecordDataChangeAsync(),
            debounce: 500
        });
    }

    loadServerData() {
        this.doLoadServerDataAsync().linkTo(this.loadTask).catchDefault();
    }

    /**
     * Reload the app to pick up a change to `optimizeRecordData` - see the reaction above for why
     * a fresh page is required.
     *
     * The change can arrive either from the toolbar switch or from restoring a saved config, and
     * the latter needs care - the reload must not land mid-restore, and the app must come back on
     * the config it was switching to:
     *
     *  - ViewManagerModel pushes a newly selected config to *all* bound settings within a single
     *    MobX action, so they are applied atomically. Waiting on `isLoading` additionally covers
     *    any in-flight fetch/save, ensuring we reload with a complete config in place.
     *  - The ViewManager records the selected config on the server via a fire-and-forget reaction.
     *    The reload could otherwise cut that write short, leaving the app to come back on the
     *    *previously* selected config while the reload was made for the new one. Repeating and
     *    awaiting the write here makes the selection durable first.
     *  - Unsaved edits need no special handling - ViewManagerModel mirrors its pending value to
     *    sessionStorage synchronously as it changes, so they are always already durable.
     */
    private async reloadForRecordDataChangeAsync() {
        const vm = this.viewManagerModel;
        try {
            await waitFor(() => !vm.isLoading, {timeout: 10 * SECONDS});
            await XH.postJson({
                url: 'xhView/updateState',
                params: {type: vm.type, viewInstance: vm.instance},
                body: {currentView: vm.view.token}
            });
        } catch (e) {
            // Reload regardless - a stale selection is recoverable, a skipped reload is not (it
            // would silently invalidate the measurement this setting exists to produce).
            this.logError('Failed to settle ViewManager state ahead of reload', e);
        }
        XH.reloadApp();
    }

    private async doLoadServerDataAsync() {
        const {
                gridModel,
                metrics,
                recordCount,
                idSeed,
                numericId,
                tree,
                showSummary,
                extraFieldCount,
                populateExtraFields
            } = this,
            streaming = this.streamServerLoad && !tree && !showSummary,
            start = Date.now();

        if (streaming) {
            await gridModel.store.loadDataAsync(
                XH.fetchNdjson({
                    url: 'gridTest/streamingData',
                    params: {recordCount, idSeed, numericId, extraFieldCount, populateExtraFields}
                })
            );
        } else {
            const {rows, summary} = await XH.fetchJson({
                url: 'gridTest/data',
                params: {
                    recordCount,
                    idSeed,
                    numericId,
                    tree,
                    showSummary,
                    loadRootAsSummary: this.loadRootAsSummary,
                    extraFieldCount,
                    populateExtraFields
                }
            });
            gridModel.loadData(rows, summary);
        }
        metrics.noteLoad(Date.now() - start);
    }

    clearGrid() {
        this.metrics.clear();
        this.metrics.runAsLoad(() => {
            this.gridModel.clear();
        });
    }

    twiddleData() {
        const {gridModel, twiddleCount, metrics} = this,
            {records} = gridModel.store;
        if (!records.length) return;

        const update = times(twiddleCount, () => ({
            ...sample(records).raw,
            day: random(-80000, 100000),
            volume: random(1000, 1200000)
        }));
        metrics.runAsUpdate(() => gridModel.updateData(update));
    }

    private createGridModel() {
        const {persistType, enableXssProtection, extraFieldCount} = this,
            storeConf: StoreConfig = {
                freezeData: false,
                idEncodesTreePath: true,
                optimizeRecordData: this.optimizeRecordData
            };

        if (enableXssProtection) {
            storeConf.fieldDefaults = {enableXssProtection};
        }

        if (this.tree && this.showSummary && this.loadRootAsSummary) {
            storeConf.loadRootAsSummary = true;
        }

        const FT = FieldType;
        storeConf.fields = [
            {name: 'symbol', type: FT.STRING},
            {name: 'trader', type: FT.STRING},
            {name: 'day', type: FT.NUMBER},
            {name: 'mtd', displayName: 'MTD', type: FT.NUMBER},
            {name: 'ytd', displayName: 'YTD', type: FT.NUMBER},
            {name: 'volume', type: FT.NUMBER}
        ];

        // Declare exactly `extraFieldCount` extra fields, matching the `extraField0..N-1` keys the
        // server emits when `populateExtraFields` is on. Left untyped (AUTO) to accept the mixed
        // value types the server generates.
        for (let i = 0; i < extraFieldCount; i++) {
            storeConf.fields.push({name: 'extraField' + i});
        }

        return new GridModel({
            persistWith: persistType ? {[persistType]: PERSIST_KEY} : null,
            selModel: {mode: 'multiple'},
            sortBy: 'id',
            emptyText: 'No records found...',
            enableExport: true,
            lockColumnGroups: this.lockColumnGroups,
            store: storeConf,
            treeMode: this.tree,
            levelLabels: times(5, n => `Level ${n}`),
            showSummary: this.showSummary,
            colChooserModel: {
                commitOnChange: this.colChooserCommitOnChange,
                showRestoreDefaults: this.colChooserShowRestoreDefaults,
                width: this.colChooserWidth ?? undefined,
                height: this.colChooserHeight ?? undefined
            },
            autosizeOptions: {
                mode: this.autosizeMode,
                renderedRowsOnly: this.renderedRowsOnly,
                includeCollapsedChildren: this.includeCollapsedChildren,
                includeHiddenColumns: this.includeHiddenColumns
            },
            columns: [
                {
                    field: 'id',
                    isTreeColumn: this.tree
                },
                {
                    field: 'symbol',
                    agOptions: {
                        filter: 'agTextColumnFilter',
                        suppressHeaderMenuButton: false
                    }
                },
                {
                    field: 'trader'
                },
                {
                    groupId: 'pnl',
                    headerName: 'P&L',
                    children: [
                        {field: 'day', highlightOnChange: true, ...pnlColumn},
                        {field: 'mtd', ...pnlColumn},
                        {field: 'ytd', ...pnlColumn}
                    ]
                },
                {
                    field: 'volume',
                    align: 'right',
                    highlightOnChange: true,
                    renderer: millionsRenderer({
                        precision: 2,
                        label: true,
                        tooltip: true
                    })
                },
                {
                    field: 'complex',
                    align: 'right',
                    renderer: (v, {record}) => {
                        return fragment(
                            fmtMillions(record.data.volume, {precision: 2, label: true}),
                            ' | ',
                            fmtNumber(record.data.day, {colorSpec: true})
                        );
                    },
                    rendererIsComplex: true
                }
            ]
        });
    }

    @action
    tearDown() {
        XH.safeDestroy(this.gridModel);
        this.gridModel = this.createGridModel();
    }
}
