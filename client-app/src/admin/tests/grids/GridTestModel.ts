import {HoistModel, managed, persist, PlainObject, XH} from '@xh/hoist/core';
import {fragment} from '@xh/hoist/cmp/layout';
import {FieldType, StoreConfig} from '@xh/hoist/data';
import {fmtMillions, fmtNumber, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {GridModel, ColumnSpec, GridAutosizeMode} from '@xh/hoist/cmp/grid';
import {cloneDeep, times} from 'lodash';
import {action, bindable, observable, makeObservable} from '@xh/hoist/mobx';
import {GridTestData} from './GridTestData';
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
    // Prefix for all IDs - change to ensure no IDs re-used across data gens.
    @bindable idSeed = 1;
    // True to generate data in tree structure.
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
    data = new GridTestData();

    @managed
    metrics = new GridTestMetrics();

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
                this.clearData();
                this.loadAsync();
            },
            debounce: 100
        });

        this.addReaction({
            track: () => this.recordCount,
            run: () => this.clearData()
        });
    }

    private clearData() {
        this.data.clear();
        this.metrics.clear();
    }

    override async doLoadAsync(loadSpec) {
        const {data, metrics, gridModel} = this;
        if (loadSpec.isAutoRefresh) return; // avoid auto-refresh confusing our tests here

        if (data.isEmpty) {
            data.generate(this);
        }
        metrics.runAsLoad(() => {
            gridModel.loadData(cloneDeep(data.rows), cloneDeep(data.summary));
        });
    }

    clearGrid() {
        this.metrics.clear();
        this.metrics.runAsLoad(() => {
            this.gridModel.clear();
        });
    }

    /**
     * Load the grid by streaming NDJSON (flat data) from the server, one record per line,
     * consumed incrementally via `Store.loadDataAsync()` - records are created as chunks
     * arrive, without ever buffering the complete raw dataset in memory.
     */
    loadNdjson() {
        this.doLoadNdjsonAsync().linkTo(this.loadSupport.loadObserver).catchDefault();
    }

    private async doLoadNdjsonAsync() {
        const {gridModel, metrics, recordCount, idSeed} = this,
            start = Date.now(),
            response = await XH.fetch({url: 'gridTest/ndjson', params: {recordCount, idSeed}});

        await gridModel.store.loadDataAsync(ndjsonChunks(response));
        metrics.noteLoad(Date.now() - start);
    }

    twiddleData(mode) {
        const {gridModel, data, twiddleCount, metrics} = this;
        metrics.runAsUpdate(() => {
            if (mode === 'update') {
                const update = data.generateUpdates(twiddleCount);
                gridModel.updateData(update);
            } else {
                data.applyUpdates(twiddleCount);
                gridModel.loadData(cloneDeep(data.rows), cloneDeep(data.summary));
            }
        });
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
        this.data.clear();
    }
}

/**
 * Read an NDJSON response body incrementally, yielding chunks (arrays) of parsed records as
 * they arrive off the network. Each line is parsed with native `JSON.parse` - no streaming
 * parser library required - and no more than one network chunk of raw text is buffered.
 */
async function* ndjsonChunks(response: Response): AsyncGenerator<PlainObject[]> {
    const reader = response.body.getReader(),
        decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const {done, value} = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, {stream: true});
        const lines = buffer.split('\n');
        buffer = lines.pop(); // retain any partial trailing line for the next chunk
        if (lines.length) yield lines.filter(Boolean).map(it => JSON.parse(it));
    }

    buffer += decoder.decode();
    if (buffer.trim()) yield [JSON.parse(buffer)];
}
