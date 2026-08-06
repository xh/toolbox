import {
    HoistModel,
    managed,
    persist,
    PersistOptions,
    PlainObject,
    TaskObserver,
    XH
} from '@xh/hoist/core';
import {fragment, p} from '@xh/hoist/cmp/layout';
import {ViewManagerModel} from '@xh/hoist/cmp/viewmanager';
import {FieldType, StoreConfig} from '@xh/hoist/data';
import {fmtMillions, fmtNumber, millionsRenderer, numberRenderer} from '@xh/hoist/format';
import {GridModel, ColumnSpec, GridAutosizeMode} from '@xh/hoist/cmp/grid';
import {Icon} from '@xh/hoist/icon';
import {StringInternSpec} from '@xh/hoist/svc';
import {isEmpty, random, round, sample, times} from 'lodash';
import {action, bindable, observable, makeObservable, runInAction} from '@xh/hoist/mobx';
import {waitFor} from '@xh/hoist/promise';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {AppModel} from '../../AppModel';
import {GridTestBenchmarkModel} from './GridTestBenchmarkModel';
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

/**
 * Stable key for the fetch-level string interning cache - see `GridTestModel.internStrings`.
 * Shared by both load paths so successive fetches can share interned values.
 */
const INTERN_KEY = 'gridTest';

/**
 * Store configs that change how record `data` objects are *built or stored*, and so require a
 * freshly loaded page when toggled - see `confirmAndReloadForRecordDataChangeAsync()`.
 *
 * Deliberately does *not* include the flags that only change what gets loaded or retained
 * (`retainRaw`, `reuseRecords`, `internStrings`) - those can be flipped and re-measured in place.
 */
const RECORD_DATA_FLAGS: Array<{prop: string; label: string}> = [
    {prop: 'projectionOnly', label: 'Projection Only'},
    {prop: 'denseRecordThreshold', label: 'Dense Record Threshold'},
    {prop: 'freezeData', label: 'Freeze Data'}
];

/** Records sampled when counting the fields actually populated by the loaded data. */
const POPULATED_FIELDS_SAMPLE_SIZE = 100;

/**
 * Value distributions the server can generate for the extra fields - see `valueMix` below and
 * `GridTestController.Generator.VALUE_MIXES` for the per-slot definitions. Keys must match the
 * server's, which rejects anything it does not recognize.
 */
export const VALUE_MIX_OPTIONS = [
    {
        value: 'mixed',
        label: 'Mixed',
        desc: 'Strings, numbers, bools and nulls, in real-world wide-grid proportions.'
    },
    {
        value: 'categorical',
        label: 'Categorical',
        desc: 'Low-cardinality repeated strings, as in status/region/desk columns.'
    },
    {
        value: 'unique',
        label: 'Unique strings',
        desc: 'A distinct string in every cell - nothing to share or intern.'
    },
    {
        value: 'numeric',
        label: 'Numeric',
        desc: 'Ints, doubles and bools only - minimal string payload.'
    }
] as const;

export type GridTestValueMix = (typeof VALUE_MIX_OPTIONS)[number]['value'];

/** Mixes that carry categorical values, and so are affected by `categoryCount`. */
const CATEGORICAL_MIXES: GridTestValueMix[] = ['mixed', 'categorical'];

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
    // Which value distribution the server uses for the populated extra fields. Memory results are
    // sensitive to value character, so an interaction measured under one mix does not carry to
    // another - vary this deliberately rather than leaving it at the default. Needs no page reload:
    // every mix emits the same keys (its null slot still emits its key, with a null value), so the
    // record *shape* - and hence V8's property-storage decision - is identical across mixes.
    @persist
    @bindable
    valueMix: GridTestValueMix = 'mixed';
    // Cardinality of the server's categorical string pool, for mixes that use one. Drives how much
    // value sharing is available - to `internStrings` most directly, but also to the VM. Names are
    // fixed-width server-side, so this varies pool size without also varying value byte size.
    @persist
    @bindable
    categoryCount = 8;
    // The Store's `projectionOnly` config - a read-only projection where each raw object becomes
    // its record's `data` by reference, so a row costs one object instead of two. Mutually
    // exclusive with `reuseRecords` (Store throws), and a different record-data representation, so
    // toggling it reloads the app. Valid here only because the test data arrives already in final
    // form and is never locally modified - the extra fields are untyped and the base fields are
    // already numbers/strings, so no `Field.parseVal` is needed. Note XSS protection is inert
    // under it, as nothing is parsed.
    @persist
    @bindable
    projectionOnly = false;
    // Override of Store's experimental `denseRecordThreshold` - the populated (non-default)
    // field count at/above which a record's data takes its fixed dense shape, vs. the sparse
    // form. Null applies the Hoist default; 1 forces the dense shape for all records; 999 forces
    // sparse for all (the pre-v87 behavior). Inert under Projection Only, which skips record
    // data construction entirely. Changing reloads the app.
    @persist
    @bindable
    denseRecordThreshold: number = null;
    // The Store's `freezeData` config - defaulted to Hoist's own default so measurements reflect
    // what apps actually run. Changes how record data objects are built and stored, so toggling
    // it reloads the app - see the reaction below.
    @persist
    @bindable
    freezeData = true;
    // The Store's `retainRaw` config - false drops each record's reference to its raw data object,
    // making the raw eligible for GC once parsed. Hoist default true.
    @persist
    @bindable
    retainRaw = true;
    // The Store's `reuseRecords` config - reuses records whose raw data object is *reference*
    // identical to the previously loaded one, skipping the default fieldwise comparison. Hoist
    // default false. Does nothing on a first load, and requires `retainRaw` (Store throws
    // otherwise - see the reaction and the guard in createGridModel() below).
    @persist
    @bindable
    reuseRecords = false;
    // True to intern string values in the fetched response via the `internStrings` FetchOption -
    // note this is a *fetch* config, not a StoreConfig. Distinct string values are stored once and
    // shared across rows (and across successive fetches with the same key).
    @persist
    @bindable
    internStrings = false;

    // True once any load has run this page - drives the pre-first-load placeholder in the panel.
    // Deliberately one-way: keyed off "never loaded" rather than "store empty" so the grid is
    // never unmounted/remounted by benchmark iterations or Clear Grid, which would contaminate
    // measurements with grid re-init cost.
    @observable hasLoadedOnce = false;

    // Snapshot of RECORD_DATA_FLAGS as of page load - i.e. the values this page's Stores were
    // built with. Compared against on change to decide whether a reload is required.
    private recordDataFlagsAtLoad: Array<boolean | number>;
    // Set while a reload confirmation is already in flight, to avoid stacking dialogs.
    private confirmingReload = false;

    // True to load from the streaming NDJSON endpoint via Store.loadDataAsync(), vs. standard.
    // For flat loading only.
    @persist
    @bindable
    streamServerLoad = true;

    @persist
    @bindable
    disableSelect = false;

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

    /** Repeatable heap/timing harness for the currently-configured flags. */
    @managed
    benchmarkModel: GridTestBenchmarkModel;

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
        this.recordDataFlagsAtLoad = this.recordDataFlagState;
        this.gridModel = this.createGridModel();
        this.benchmarkModel = new GridTestBenchmarkModel(this);
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
                this.enableXssProtection,
                this.extraFieldCount,
                this.populateExtraFields,
                this.retainRaw,
                this.reuseRecords
            ],
            run: () => {
                XH.safeDestroy(this.gridModel);
                this.gridModel = this.createGridModel();
                this.metrics.clear();
            },
            debounce: 100
        });

        // Dataset-shaping settings that take effect on the next load. No grid rebuild needed -
        // they change the values the server sends, not the fields the Store declares - but any
        // metrics on screen describe the previous dataset and would be misread as current.
        this.addReaction({
            track: () => [this.recordCount, this.valueMix, this.categoryCount],
            run: () => this.metrics.clear()
        });

        // Reload rather than rebuilding the grid in place. V8 decides an object's property
        // storage per *isolate*, from a transition tree shared across all code in the page: once
        // a given set of keys has been built one way, later objects with those keys can inherit
        // that decision. Measuring both record-data representations in a single session
        // therefore contaminates whichever runs second, in either direction. Each side of an A/B
        // must be measured in a fresh page. These settings and the data-shape settings above are
        // all persisted, so a configured A/B survives the reload intact - see below for the care
        // required when the change arrives via a ViewManager config switch.
        this.addReaction({
            track: () => this.recordDataFlagState,
            run: () => this.confirmAndReloadForRecordDataChangeAsync(),
            debounce: 500
        });

        // `reuseRecords` cannot be combined with `retainRaw: false` - Store throws, as reuse is
        // keyed off the raw reference. Clear it rather than letting a restored config blow up.
        this.addReaction({
            track: () => this.retainRaw,
            run: retainRaw => {
                if (!retainRaw && this.reuseRecords) {
                    runInAction(() => (this.reuseRecords = false));
                }
            }
        });

        // Store throws if `projectionOnly` is paired with `reuseRecords`. Clear it on the way in.
        this.addReaction({
            track: () => this.projectionOnly,
            run: projectionOnly => {
                if (!projectionOnly) return;
                runInAction(() => (this.reuseRecords = false));
            }
        });

        // Interned values are retained for reuse by the next fetch with the same key - drop them
        // when interning is switched off, so a later run does not inherit a warm cache.
        this.addReaction({
            track: () => this.internStrings,
            run: internStrings => {
                if (!internStrings) this.clearInternCache();
            }
        });
    }

    loadServerData() {
        this.doLoadServerDataAsync().linkTo(this.loadTask).catchDefault();
    }

    /** Current values of the flags that require a fresh page when changed. */
    private get recordDataFlagState(): Array<boolean | number> {
        return RECORD_DATA_FLAGS.map(it => this[it.prop]);
    }

    /**
     * Confirm, then reload the app to pick up a change to any RECORD_DATA_FLAGS setting - see the
     * reaction above for why a fresh page is required. Reverts the setting(s) if the user
     * declines, so the switches never disagree with the Store actually under test.
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
     *    awaiting the write here makes the selection durable first. Note the confirmation dialog
     *    usually gives that write time to land on its own, but it is not a guarantee - a slow or
     *    failed request would fail silently and look exactly like a good run - so we still wait.
     *  - Unsaved edits need no special handling - ViewManagerModel mirrors its pending value to
     *    sessionStorage synchronously as it changes, so they are always already durable.
     */
    private async confirmAndReloadForRecordDataChangeAsync() {
        if (this.confirmingReload) return;

        // Compare against the values this page's Stores were built with, so reverting below (or
        // toggling back by hand) settles without a second prompt.
        const {recordDataFlagsAtLoad} = this,
            changed = RECORD_DATA_FLAGS.map((it, idx) => ({
                ...it,
                priorValue: recordDataFlagsAtLoad[idx]
            })).filter(it => this[it.prop] !== it.priorValue);
        if (isEmpty(changed)) return;

        const summary = changed
            .map(it => {
                const v = this[it.prop];
                return `${it.label} ${typeof v === 'boolean' ? (v ? 'on' : 'off') : (v ?? 'default')}`;
            })
            .join(' and ');

        this.confirmingReload = true;
        const confirmed = await XH.confirm({
            title: 'Reload required',
            icon: Icon.refresh(),
            message: fragment(
                p(`Turning ${summary} requires reloading the app.`),
                p(
                    'These settings change how record data objects are built and stored, which ' +
                        'only takes effect on a freshly loaded page. Reloading also keeps ' +
                        'benchmark runs independent - results measured before and after the ' +
                        'change within a single session are not comparable.'
                ),
                p('Your current settings are preserved across the reload.')
            ),
            confirmProps: {text: 'Reload Now', intent: 'primary'},
            cancelProps: {text: 'Cancel'}
        });
        this.confirmingReload = false;

        if (!confirmed) {
            runInAction(() => changed.forEach(it => (this[it.prop] = it.priorValue)));
            return;
        }

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
        this.metrics.noteLoad(await this.loadTestDataAsync());
    }

    /**
     * Load test data from the server per the current config, returning elapsed ms - the shared
     * load path for the toolbar's "Load Server Data" button and the benchmark harness.
     *
     * Note the returned time covers fetch + record creation. The two are interleaved by design on
     * the streaming path, and are not separable there.
     */
    async loadTestDataAsync(): Promise<number> {
        // Set before loading so the grid mounts in place of the placeholder immediately - it
        // then fills as data arrives, exactly as it did when mounted from page load.
        runInAction(() => (this.hasLoadedOnce = true));

        const {gridModel, useStreaming} = this,
            start = performance.now();

        if (useStreaming) {
            const stream = XH.fetchNdjson({
                url: 'gridTest/streamingData',
                params: this.streamingParams,
                internStrings: this.internSpecFor('stream')
            });
            await gridModel.store.loadDataAsync(stream.lines);
        } else {
            const {rows, summary} = await this.fetchJsonRowsAsync();
            gridModel.loadData(rows, summary);
        }

        return performance.now() - start;
    }

    /**
     * Fetch raw rows into an array *without* loading them into the Store, for the benchmark's
     * "same raw refs" reload scenario. That scenario is the only shape in which `reuseRecords` can
     * actually hit, as it matches on raw-object reference identity - a second fetch of the same
     * dataset yields fresh objects and can never reuse.
     */
    async fetchRawRowsAsync(): Promise<{rows: PlainObject[]; summary: PlainObject}> {
        if (!this.useStreaming) return this.fetchJsonRowsAsync();

        const rows: PlainObject[] = [],
            {lines} = XH.fetchNdjson({
                url: 'gridTest/streamingData',
                params: this.streamingParams,
                internStrings: this.internSpecFor('stream')
            });
        for await (const row of lines) {
            rows.push(row);
        }
        return {rows, summary: null};
    }

    /** Load already-fetched raw rows into the Store, returning elapsed ms. */
    loadRawRows(rows: PlainObject[], summary: PlainObject): number {
        const start = performance.now();
        this.gridModel.loadData(rows, summary);
        return performance.now() - start;
    }

    /** Drop any retained string-interning cache, so the next fetch starts cold. */
    clearInternCache() {
        XH.fetchService.clearInternCaches(INTERN_KEY);
    }

    /** True when the (flat-only) streaming endpoint will be used for the next load. */
    get useStreaming(): boolean {
        return this.streamServerLoad && !this.tree && !this.showSummary;
    }

    /** Count of fields declared on the Store under test. */
    get declaredFieldCount(): number {
        return this.gridModel.store.fields.length;
    }

    /** True when the selected `valueMix` carries categorical values, making `categoryCount` live. */
    get categoryCountApplies(): boolean {
        return CATEGORICAL_MIXES.includes(this.valueMix);
    }

    /**
     * Mean count of fields actually populated (i.e. holding a non-default value) across a sample
     * of loaded records - the measure of how dense the record data actually is. Read from parsed
     * record data, so it holds regardless of `retainRaw`.
     */
    get populatedFieldCount(): number {
        const {store} = this.gridModel,
            sample = store.allRecords.slice(0, POPULATED_FIELDS_SAMPLE_SIZE),
            {fields} = store;
        if (isEmpty(sample) || isEmpty(fields)) return null;

        let populated = 0;
        sample.forEach(rec => {
            fields.forEach(f => {
                if (rec.data[f.name] !== f.defaultValue) populated++;
            });
        });
        return round(populated / sample.length);
    }

    private async fetchJsonRowsAsync(): Promise<{rows: PlainObject[]; summary: PlainObject}> {
        const {tree, showSummary} = this;
        return XH.fetchJson({
            url: 'gridTest/data',
            params: {
                ...this.dataShapeParams,
                tree,
                showSummary,
                loadRootAsSummary: this.loadRootAsSummary
            },
            internStrings: this.internSpecFor('json')
        });
    }

    private get streamingParams(): PlainObject {
        return this.dataShapeParams;
    }

    /** Params describing the dataset itself - shared by both load paths. */
    private get dataShapeParams(): PlainObject {
        const {
            recordCount,
            idSeed,
            numericId,
            extraFieldCount,
            populateExtraFields,
            valueMix,
            categoryCount
        } = this;
        return {
            recordCount,
            idSeed,
            numericId,
            extraFieldCount,
            populateExtraFields,
            valueMix,
            categoryCount
        };
    }

    /**
     * Interning spec for a load, or null when interning is off.
     *
     * The streaming endpoint emits a bare stream of row objects, so every row is interned. The
     * JSON endpoint wraps its rows in a `{rows, summary}` envelope, and interning must be pointed
     * at that key via `childrenKey` to reach them at all. FetchService supports a single
     * `childrenKey`, so a *tree* JSON load interns the top-level rows only - nested children are
     * not reached. Use the streaming path for a complete picture.
     */
    private internSpecFor(shape: 'stream' | 'json'): StringInternSpec {
        return this.internStrings
            ? {key: INTERN_KEY, childrenKey: shape === 'json' ? 'rows' : null}
            : null;
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
        const {persistType, enableXssProtection, extraFieldCount, retainRaw} = this,
            storeConf: StoreConfig = {
                freezeData: this.freezeData,
                idEncodesTreePath: true,
                // Belt-and-braces throughout - Store throws on each illegal pairing below. The UI
                // disables the switches and reactions clear them, but a config restored from the
                // ViewManager could still arrive holding an incompatible combination.
                projectionOnly: this.projectionOnly,
                retainRaw,
                reuseRecords: this.reuseRecords && retainRaw && !this.projectionOnly,
                experimental: {denseRecordThreshold: this.denseRecordThreshold}
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
            store: storeConf,
            treeMode: this.tree,
            levelLabels: times(5, n => `Level ${n}`),
            showSummary: this.showSummary,
            colChooserModel: true,
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
