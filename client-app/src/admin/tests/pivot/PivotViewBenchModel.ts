import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {Cube, CubeFieldSpec, PivotView} from '@xh/hoist/data';
import {numberRenderer} from '@xh/hoist/format';
import {bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {PivotProfile, PROFILES, generateLeaves, tickLeaves} from './PivotBenchData';

/**
 * Benchmark for the {@link PivotView} data layer, against the phase 0 baseline captured from the
 * `PivotDataModel` prototype. Deliberately separate from `PivotBenchModel` so that baseline stays
 * untouched and comparable.
 *
 * `build` is measured from raw data - Cube load plus view creation - to match what the prototype's
 * `PivotDataModel.update()` did. Both tick metrics perturb a slice of leaves and push them through a
 * *connected* view - the metric the prototype failed by 4-7x - `tick` by resubmitting the full leaf
 * array as the baseline did, `deltaTick` by submitting only the changed records.
 *
 * See `docs/planning/pivot-grid.md` in hoist-react for the acceptance criteria.
 */

/** Baseline ms from the plan doc, so the comparison is visible in-page rather than looked up. */
const BASELINE: Record<string, {build: number; tick: number}> = {
    typical: {build: 138, tick: 128},
    typicalDrill: {build: 279, tick: 335},
    heavy: {build: 743, tick: 836},
    heavyDrill: {build: 2485, tick: 3601},
    wide: {build: 1370, tick: 1734},
    wideDrill: {build: 2150, tick: 3146},
    pathological: {build: 27011, tick: 27327}
};

/**
 * Pass/fail gates, the only place to change them. Builds are phase 0's revised targets, tightened
 * because the prototype already met the originals. Ticks gate on the *delta* tick - a full-array
 * submit is dominated by Store-wide record diffing that no pivot implementation can influence.
 */
const GATES: Record<string, {buildMs: number; deltaTickMs: number}> = {
    typical: {buildMs: 140, deltaTickMs: 15},
    typicalDrill: {buildMs: 290, deltaTickMs: 15}
};

export class PivotViewBenchModel extends HoistModel {
    @bindable tickPct = 1;
    @bindable tickReps = 5;
    @observable running = false;
    @observable status: string = null;

    private seq = 0;

    @managed
    gridModel: GridModel = new GridModel({
        // `passed` has no column of its own - the Gate renderer reads it, so declare it explicitly
        // or GridModel's column-derived fields leave it undefined and every gate reads as a failure.
        store: {idSpec: 'id', fields: [{name: 'passed', type: 'bool'}]},
        emptyText: 'Run the benchmark to see results.',
        columns: [
            {field: 'label', headerName: 'Profile', width: 130},
            {field: 'groupRows', headerName: 'Group rows', width: 105, align: 'right'},
            {field: 'cells', headerName: 'Cells', width: 90, align: 'right'},
            {field: 'paths', headerName: 'Paths', width: 70, align: 'right'},
            {
                field: 'buildMs',
                headerName: 'Build ms',
                width: 90,
                align: 'right',
                renderer: numberRenderer({precision: 0})
            },
            {field: 'baseBuild', headerName: 'Base', width: 75, align: 'right'},
            {
                field: 'deltaTickMs',
                headerName: 'Delta tick ms',
                width: 115,
                align: 'right',
                headerTooltip:
                    'Tick submitting ONLY the changed records, isolating pivot work from the ' +
                    'Cube-wide record diff that a full-array submit also pays.',
                renderer: numberRenderer({precision: 1})
            },
            {
                field: 'tickMs',
                headerName: 'Tick ms',
                width: 90,
                align: 'right',
                headerTooltip:
                    'Tick resubmitting the full leaf array, as the phase 0 baseline did. Reported ' +
                    'for that comparison only - not gated.',
                renderer: numberRenderer({precision: 1})
            },
            {field: 'baseTick', headerName: 'Base', width: 75, align: 'right'},
            {
                field: 'tickSpeedup',
                headerName: 'Tick vs base',
                width: 110,
                align: 'right',
                renderer: v => (v ? `${v.toFixed(1)}x faster` : '-')
            },
            {
                field: 'gate',
                headerName: 'Gate',
                width: 150,
                renderer: (v, {record}) =>
                    !v ? '-' : `${record.data.passed ? '✓ pass' : '✗ FAIL'} - ${v}`
            }
        ]
    });

    constructor() {
        super();
        makeObservable(this);
    }

    async runAllAsync() {
        await this.runAsync(PROFILES.filter(p => !p.optIn));
    }

    async runProfileAsync(id: string) {
        await this.runAsync(PROFILES.filter(p => p.id === id));
    }

    //------------------------
    // Implementation
    //------------------------
    private async runAsync(profiles: PivotProfile[]) {
        this.running = true;
        try {
            for (const profile of profiles) {
                await this.runOneAsync(profile);
            }
            this.status = null;
        } catch (e) {
            this.status = `FAILED: ${(e as Error).message}`;
            XH.handleException(e, {showAlert: false});
        } finally {
            this.running = false;
        }
    }

    private async runOneAsync(profile: PivotProfile) {
        const {id, label, valueFields} = profile,
            tickCount = Math.max(1, Math.round((profile.leaves * this.tickPct) / 100));

        this.status = `${label}: generating ${profile.leaves} leaves...`;
        await wait(50);
        const leaves = generateLeaves(profile);

        // Warm up and discard - otherwise the first timed build absorbs JIT for the whole path.
        this.status = `${label}: warming up...`;
        await wait(50);
        await this.buildAsync(profile, leaves.slice(0, Math.min(2000, leaves.length)));

        this.status = `${label}: build...`;
        await wait(50);
        const t0 = performance.now(),
            {cube, view} = await this.buildAsync(profile, leaves),
            buildMs = performance.now() - t0;

        const groupRows = countRows(view.result.rows),
            cells = (view as any)._cellRows?.length ?? 0,
            paths = view.result.cellFields.length / valueFields.length;

        this.status = `${label}: ticking ${tickCount} leaves x ${this.tickReps}...`;
        const times: number[] = [];
        for (let i = 0; i < this.tickReps; i++) {
            tickLeaves(leaves, tickCount);
            await wait(50);
            const t1 = performance.now();
            await cube.updateDataAsync(leaves);
            times.push(performance.now() - t1);
        }
        const tickMs = median(times);

        // Same perturbation, but submitted as an explicit update transaction. A full-array submit
        // makes the Store diff every record, which is a fixed cost the pivot layer cannot influence
        // - this separates the two so the incremental path can be judged on its own.
        this.status = `${label}: delta ticks...`;
        const deltaTimes: number[] = [];
        for (let i = 0; i < this.tickReps; i++) {
            const touched = tickedSlice(leaves, tickCount);
            await wait(50);
            const t2 = performance.now();
            await cube.updateDataAsync({update: touched});
            deltaTimes.push(performance.now() - t2);
        }
        const deltaTickMs = median(deltaTimes);

        XH.safeDestroy(view, cube);
        await wait(50);

        const base = BASELINE[id],
            gate = GATES[id],
            gateLabel = gate
                ? `build <= ${gate.buildMs} / delta tick <= ${gate.deltaTickMs}`
                : null;

        this.gridModel.store.updateData({
            add: [
                {
                    id: `b${++this.seq}`,
                    label,
                    groupRows,
                    cells,
                    paths,
                    buildMs,
                    baseBuild: base?.build ?? null,
                    tickMs,
                    deltaTickMs,
                    baseTick: base?.tick ?? null,
                    tickSpeedup: base ? base.tick / tickMs : null,
                    gate: gateLabel,
                    passed: gate ? buildMs <= gate.buildMs && deltaTickMs <= gate.deltaTickMs : null
                }
            ]
        });
    }

    private async buildAsync(
        profile: PivotProfile,
        leaves: PlainObject[]
    ): Promise<{cube: Cube; view: PivotView}> {
        const cube = new Cube({fields: cubeFields(profile), idSpec: 'id'});
        await cube.loadDataAsync(leaves);

        const view = cube.createPivotView({
            query: {
                dimensions: profile.groupBy,
                pivotDimensions: profile.pivotBy,
                valueFields: profile.valueFields,
                includeRoot: true,
                maxPivotPaths: null
            },
            connect: true
        });
        return {cube, view};
    }
}

function cubeFields(profile: PivotProfile): CubeFieldSpec[] {
    return [
        ...Object.keys(profile.dims).map(name => ({
            name,
            type: 'string' as const,
            isDimension: true
        })),
        ...profile.valueFields.map(name => ({
            name,
            type: 'number' as const,
            aggregator: 'SUM' as const
        }))
    ];
}

/** Perturb `count` leaves and return just those records, for a delta update. */
function tickedSlice(leaves: PlainObject[], count: number): PlainObject[] {
    const ret: PlainObject[] = [];
    for (let i = 0; i < count; i++) {
        const rec = leaves[(i * 7919) % leaves.length];
        rec.pnl = (rec.pnl ?? 0) * 1.01 + 1;
        rec.mktVal = (rec.mktVal ?? 0) * 1.01 + 1;
        rec.quantity = Math.round((rec.quantity ?? 0) * 1.01 + 1);
        ret.push(rec);
    }
    return ret;
}

function countRows(rows: any[]): number {
    let ret = 0;
    const walk = (rs: any[]) => {
        rs?.forEach(r => {
            ret++;
            walk(r.children);
        });
    };
    walk(rows);
    return ret;
}

function median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b),
        mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
