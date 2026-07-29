import {GridModel} from '@xh/hoist/cmp/grid';
import {fragment, p, pre} from '@xh/hoist/cmp/layout';
import {HoistModel, managed, PlainObject, TaskObserver, XH} from '@xh/hoist/core';
import {Cube, Store, View} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {times} from 'lodash';
import {
    allStoreFieldSpecs,
    cubeFieldSpecs,
    FIELD_COUNT,
    generateRawRecords,
    VIEW_FIELDS,
    viewStoreFieldSpecs
} from './StoreProxyBenchData';

/** The Store-construction strategies under test, each fed from the same source Cube. */
export type BenchMode = 'proxy' | 'copy' | 'view' | 'viewRaw';

export const MODE_LABELS: Record<BenchMode, string> = {
    proxy: 'Proxy Store',
    copy: 'Copy record.data',
    view: 'View → Store',
    viewRaw: 'View → Store (useRawAsData)'
};

export const MODE_DESCRIPTIONS: Record<BenchMode, string> = {
    proxy: 'cube.store.createProxy() - records shared by reference, no copy.',
    copy:
        'new Store({fields: all 160}) + loadData(cube.store.records.map(it => it.data)). An ' +
        'id-for-id clone, so updates are applied to both Cube and Store from the same payload.',
    view: 'cube.createView({dimensions: [], includeLeaves: true}) over 35 fields, connected.',
    viewRaw: 'Same View, but the connected Store uses ViewRowData rows as record data directly.'
};

export interface BenchResult {
    id: string;
    mode: BenchMode;
    label: string;
    records: number;
    fields: number;
    buildMs: number;
    heapMB: number;
    updateMs: number;
    filterMs: number;
    filteredCount: number;
    ok: boolean;
}

export class StoreProxyBenchModel extends HoistModel {
    @managed cube: Cube;
    @managed resultsGridModel: GridModel;
    @managed runTask = TaskObserver.trackLast();

    /** Source record count loaded into the Cube. */
    @bindable recordCount = 30000;

    /** Records perturbed per update-propagation measurement. */
    @bindable updateCount = 500;

    @observable cubeCount = 0;
    @observable heapImprecise = false;
    @observable.ref status: string = 'Load the Cube to begin.';

    /** Live target under test - torn down between runs so only one variant is ever resident. */
    @managed private targetStore: Store = null;
    @managed private targetView: View = null;

    private resultSeq = 0;

    constructor() {
        super();
        makeObservable(this);
        this.cube = new Cube({
            idSpec: 'id',
            fields: cubeFieldSpecs(),
            // Drop raw references post-parse - the generated source objects are throwaway, and
            // retaining them would double-count the Cube's own footprint in every heap baseline.
            retainRaw: false
        });
        this.resultsGridModel = this.createResultsGridModel();
    }

    //------------------------
    // Actions
    //------------------------
    loadCube() {
        this.runAsync(() => this.doLoadCubeAsync()).linkTo(this.runTask);
    }

    runMode(mode: BenchMode) {
        this.runAsync(() => this.runModeAsync(mode)).linkTo(this.runTask);
    }

    runAll() {
        this.runAsync(async () => {
            for (const mode of ['proxy', 'copy', 'view', 'viewRaw'] as BenchMode[]) {
                await this.runModeAsync(mode);
            }
            this.setStatus('All modes complete.');
        }).linkTo(this.runTask);
    }

    @action
    clearResults() {
        this.resultsGridModel.clear();
        this.resultSeq = 0;
    }

    //------------------------
    // Implementation
    //------------------------
    private runAsync(fn: () => Promise<void>): Promise<void> {
        if (!this.checkFlags()) return Promise.resolve();
        return fn().catchDefault();
    }

    private async doLoadCubeAsync() {
        const {recordCount} = this;

        this.setStatus(`Generating ${recordCount.toLocaleString()} records...`);
        await wait(50);
        let raw = generateRawRecords(recordCount);

        this.setStatus('Loading Cube...');
        await wait(50);
        await this.cube.loadDataAsync(raw);

        // Release the generated source array - the Cube has parsed it and holds no raw refs.
        raw = null;

        this.teardownTarget();
        this.clearResults();
        await this.settleAsync();

        this.setCubeCount(this.cube.store.count);
        this.setStatus(
            `Cube loaded: ${this.cubeCount.toLocaleString()} records × ${FIELD_COUNT} fields. ` +
                `Baseline heap ${await this.sampleHeapAsync()} MB.`
        );
    }

    private async runModeAsync(mode: BenchMode) {
        if (this.cube.empty) {
            XH.toast({message: 'Load the Cube first.', intent: 'warning'});
            return;
        }

        this.setStatus(`${MODE_LABELS[mode]}: measuring baseline...`);
        this.teardownTarget();
        await this.settleAsync();
        const heapBefore = await this.sampleHeapAsync();

        this.setStatus(`${MODE_LABELS[mode]}: building...`);
        await wait(50);
        const t0 = performance.now();
        this.buildTarget(mode);
        // Connected Views push their rows synchronously on connect, but let any reaction-driven
        // work (proxy sync, MobX observers) flush before calling the build done.
        await wait();
        const buildMs = Math.round(performance.now() - t0);

        this.setStatus(`${MODE_LABELS[mode]}: measuring heap...`);
        await this.settleAsync();
        const heapAfter = await this.sampleHeapAsync();

        this.setStatus(`${MODE_LABELS[mode]}: measuring update propagation...`);
        const {updateMs, ok} = await this.timeUpdateAsync(mode);

        this.setStatus(`${MODE_LABELS[mode]}: measuring filter...`);
        const {filterMs, filteredCount} = await this.timeFilterAsync();

        this.addResult({
            id: `r${++this.resultSeq}`,
            mode,
            label: MODE_LABELS[mode],
            records: this.targetStore.count,
            fields: this.targetStore.fields.length,
            buildMs,
            heapMB: Math.round((heapAfter - heapBefore) * 10) / 10,
            updateMs,
            filterMs,
            filteredCount,
            ok
        });

        this.setStatus(`${MODE_LABELS[mode]} complete.`);
    }

    private buildTarget(mode: BenchMode) {
        const {cube} = this;

        switch (mode) {
            case 'proxy':
                // Zero-copy: adopts the primary's fields and shares its records by reference.
                this.targetStore = cube.store.createProxy();
                break;
            case 'copy': {
                const store = new Store({fields: allStoreFieldSpecs()});
                store.loadData(cube.store.records.map(it => it.data));
                this.targetStore = store;
                break;
            }
            case 'view':
            case 'viewRaw': {
                const store = new Store({
                    fields: viewStoreFieldSpecs(),
                    useRawAsData: mode === 'viewRaw'
                });
                this.targetView = cube.createView({
                    query: {fields: VIEW_FIELDS, dimensions: [], includeLeaves: true},
                    stores: store,
                    connect: true
                });
                this.targetStore = store;
                break;
            }
        }
    }

    /**
     * Perturb `updateCount` Cube records and time how long the target takes to reflect them,
     * verifying that it actually did. The copy mode has no live connection, but its Store is an
     * id-for-id clone of the Cube's - so an app feeds the same payload to both rather than
     * re-copying. That second `updateData` is inside the timed block, as the app would pay it.
     */
    private async timeUpdateAsync(mode: BenchMode): Promise<{updateMs: number; ok: boolean}> {
        const {cube, updateCount, targetStore} = this,
            {records} = cube.store;

        // Cube updates are full-record replacements, not partial patches - send every field, as a
        // real feed would. A sparse payload would null the other 158 fields and both corrupt the
        // dataset and understate the parse cost being measured.
        const updates = times(updateCount, i => {
            const rec = records[(i * 7919) % records.length];
            return {
                ...rec.data,
                num0: rec.data.num0 * 1.01,
                num1: rec.data.num1 * 0.99
            } as PlainObject;
        });

        // Sample one updated record to verify propagation - id and expected post-update value.
        const probe = updates[0],
            expected = probe.num0;

        await wait(50);
        const t0 = performance.now();
        await cube.updateDataAsync(updates);
        if (mode === 'copy') {
            targetStore.updateData(updates);
        }
        await wait();
        const updateMs = Math.round(performance.now() - t0);

        // Proxy/copy stores are keyed by the Cube record id; View leaf rows carry a synthesized
        // row id and expose their source record's id as `cubeLabel`.
        const isView = mode === 'view' || mode === 'viewRaw',
            rec = isView
                ? targetStore.records.find(it => it.data.cubeLabel === String(probe.id))
                : targetStore.getById(probe.id),
            actual = rec?.data.num0,
            ok = actual != null && Math.abs(actual - expected) < 1e-6;

        if (!ok) {
            console.warn(
                `[StoreProxyBench] ${MODE_LABELS[mode]} did not reflect update for id=${probe.id}: ` +
                    `expected ${expected}, got ${actual}`
            );
        }

        return {updateMs, ok};
    }

    /**
     * Time an independent filter applied to the target - the per-component projection proxy mode
     * exists to make cheap. Cleared again afterwards so the next measurement starts unfiltered.
     */
    private async timeFilterAsync(): Promise<{filterMs: number; filteredCount: number}> {
        const {targetStore} = this,
            value = this.cube.store.records[0].data.str0;

        await wait(50);
        const t0 = performance.now();
        targetStore.setFilter({field: 'str0', op: '=', value});
        await wait();
        const filterMs = Math.round(performance.now() - t0),
            filteredCount = targetStore.count;

        targetStore.setFilter(null);
        await wait();
        return {filterMs, filteredCount};
    }

    private teardownTarget() {
        XH.safeDestroy(this.targetView);
        XH.safeDestroy(this.targetStore);
        this.targetView = null;
        this.targetStore = null;
    }

    /** GC (if exposed) and sample the JS heap, in MB. */
    private async sampleHeapAsync(): Promise<number> {
        const w = window as any,
            hasGC = typeof w.gc === 'function';

        this.setHeapImprecise(!hasGC);
        if (hasGC) {
            for (let i = 0; i < 3; i++) {
                w.gc();
                await wait(30);
            }
        }

        const mem = (performance as any).memory;
        return mem ? Math.round((mem.usedJSHeapSize / 1048576) * 10) / 10 : null;
    }

    /** Yield long enough for teardown, reactions, and detached DOM to become collectible. */
    private async settleAsync() {
        await wait(100);
    }

    /**
     * Heap deltas are meaningless without forced GC and unquantized readings - bail out with
     * guidance rather than publishing numbers the developer would misread as real.
     */
    private checkFlags(): boolean {
        const w = window as any;
        if (typeof w.gc === 'function' && (performance as any).memory) return true;

        XH.alert({
            title: 'Memory flags required',
            message: fragment(
                p(
                    'This benchmark reports heap deltas, which require Chrome/Chromium launched with:'
                ),
                pre('--js-flags=--expose-gc --enable-precise-memory-info'),
                p(
                    '--expose-gc allows a forced collection before each sample; ' +
                        '--enable-precise-memory-info removes heap-size quantization. Without both, ' +
                        'the deltas below would be dominated by uncollected garbage and rounding.'
                )
            )
        });
        return false;
    }

    @action
    private addResult(result: BenchResult) {
        this.resultsGridModel.store.addRecords(result);
        console.log(
            `[StoreProxyBench] ${result.label} | ${result.records.toLocaleString()} recs × ` +
                `${result.fields} fields | build ${result.buildMs}ms | ` +
                `heap +${result.heapMB}MB | update+sync ${result.updateMs}ms | ` +
                `filter ${result.filterMs}ms -> ${result.filteredCount} | reflects=${result.ok}`
        );
    }

    @action
    private setStatus(status: string) {
        this.status = status;
    }

    @action
    private setCubeCount(count: number) {
        this.cubeCount = count;
    }

    @action
    private setHeapImprecise(v: boolean) {
        this.heapImprecise = v;
    }

    private createResultsGridModel() {
        return new GridModel({
            store: {
                fields: [
                    {name: 'mode', type: 'string'},
                    {name: 'label', type: 'string'},
                    {name: 'records', type: 'number'},
                    {name: 'fields', type: 'number'},
                    {name: 'buildMs', type: 'number'},
                    {name: 'heapMB', type: 'number'},
                    {name: 'updateMs', type: 'number'},
                    {name: 'filterMs', type: 'number'},
                    {name: 'filteredCount', type: 'number'},
                    {name: 'ok', type: 'bool'}
                ]
            },
            emptyText: 'No runs yet - load the Cube, then Run All.',
            sizingMode: 'standard',
            rowBorders: true,
            columns: [
                {field: 'label', headerName: 'Mode', width: 220},
                {
                    field: 'records',
                    headerName: 'Records',
                    align: 'right',
                    width: 100,
                    renderer: numberRenderer({precision: 0})
                },
                {field: 'fields', headerName: 'Fields', align: 'right', width: 80},
                {
                    field: 'buildMs',
                    headerName: 'Build (ms)',
                    align: 'right',
                    width: 110,
                    renderer: numberRenderer({precision: 0})
                },
                {
                    field: 'heapMB',
                    headerName: 'Heap Δ (MB)',
                    align: 'right',
                    width: 120,
                    renderer: numberRenderer({precision: 1})
                },
                {
                    field: 'updateMs',
                    headerName: 'Update+Sync (ms)',
                    align: 'right',
                    width: 145,
                    renderer: numberRenderer({precision: 0})
                },
                {
                    field: 'filterMs',
                    headerName: 'Filter (ms)',
                    align: 'right',
                    width: 110,
                    renderer: numberRenderer({precision: 0})
                },
                {
                    field: 'filteredCount',
                    headerName: 'Filtered',
                    align: 'right',
                    width: 100,
                    renderer: numberRenderer({precision: 0})
                },
                {
                    field: 'ok',
                    headerName: 'Reflects?',
                    align: 'center',
                    width: 90,
                    renderer: v => (v ? '✓' : '✗')
                }
            ]
        });
    }
}
