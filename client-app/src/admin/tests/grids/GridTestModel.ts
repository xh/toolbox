import {HoistModel, managed, persist, TaskObserver, XH} from '@xh/hoist/core';
import {ndjsonChunks} from '@xh/hoist/utils/async';
import {fragment} from '@xh/hoist/cmp/layout';
import {FieldType, StoreConfig} from '@xh/hoist/data';
import {fmtMillions, fmtNumber, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {GridModel, ColumnSpec, GridAutosizeMode} from '@xh/hoist/cmp/grid';
import {random, sample, times} from 'lodash';
import {action, bindable, observable, makeObservable} from '@xh/hoist/mobx';
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
    override persistWith = {localStorageKey: PERSIST_KEY};

    // Total count (approx) of all nodes generated (parents + children).
    @bindable recordCount = 200000;
    // Number of random records to perturb
    @bindable twiddleCount = Math.round(this.recordCount * 0.5);
    // Prefix for all IDs - change to ensure no IDs re-used across loads.
    @bindable idSeed = 1;
    // True to load data in tree structure.
    @bindable tree = false;
    // True to use an incremental numeric id as grid id.
    @bindable numericId = false;
    // True to show summary row.
    @bindable showSummary = false;
    // True to use tree root node as summary row.
    @bindable loadRootAsSummary = false;
    // True to enable XSS protection at store level.
    @bindable enableXssProtection = false;
    // Value > 0 will trigger creation of additional (null value) fields on the store to
    // help stress-test stores with a wide array of fields.
    @bindable extraFieldCount = 50;

    // True to load from the streaming NDJSON endpoint via Store.loadDataAsync(), vs. standard.
    // For flat loading only.
    @bindable streamServerLoad = true;

    @bindable disableSelect = false;

    @bindable colChooserCommitOnChange = true;
    @bindable colChooserShowRestoreDefaults = true;
    @bindable colChooserWidth = null;
    @bindable colChooserHeight = null;

    @bindable lockColumnGroups = true;

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
                this.extraFieldCount
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
    }

    loadServerData() {
        this.doLoadServerDataAsync().linkTo(this.loadTask).catchDefault();
    }

    private async doLoadServerDataAsync() {
        const {gridModel, metrics, recordCount, idSeed, numericId, tree, showSummary} = this,
            streaming = this.streamServerLoad && !tree && !showSummary,
            start = Date.now();

        if (streaming) {
            const response = await XH.fetch({
                url: 'gridTest/streamingData',
                params: {recordCount, idSeed, numericId}
            });
            await gridModel.store.loadDataAsync(ndjsonChunks(response));
        } else {
            const {rows, summary} = await XH.fetchJson({
                url: 'gridTest/data',
                params: {
                    recordCount,
                    idSeed,
                    numericId,
                    tree,
                    showSummary,
                    loadRootAsSummary: this.loadRootAsSummary
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
                idEncodesTreePath: true
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

        if (extraFieldCount > 0) {
            for (let i = 0; i <= extraFieldCount; i++) {
                storeConf.fields.push({
                    name: 'extraField' + i
                });
            }
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

