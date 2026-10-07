import {GridModel} from '@xh/hoist/cmp/grid';
import {PivotGridModel} from '@xh/hoist/cmp/pivotgrid';
import type {PlainObject} from '@xh/hoist/core';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import type {
    AggregatorToken,
    BucketSpecFn,
    CubeFieldSpec,
    PivotQueryConfig,
    PivotView,
    QueryConfig,
    View,
    ViewRowData
} from '@xh/hoist/data';
import {Cube, flattenFilter, getCubeLeaves, Store} from '@xh/hoist/data';
import {bindable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {wait} from '@xh/hoist/promise';
import {castArray, difference, isEmpty, isEqual, uniq} from 'lodash';
import {generateLeaves, getProfile, tickLeaves} from './PivotBenchData';
import type {PivotCheck, RefAggKind} from './PivotViewCheck';
import {checkCellStore, checkPivotView, comparePivotViews} from './PivotViewCheck';

interface Scenario {
    id: string;
    label: string;
    groupBy: string[];
    pivotBy: string[];
    valueFields: string[];
    /** Leaf count - kept small so the suite runs interactively. */
    leaves: number;
    includeRoot?: boolean;
    includeLeaves?: boolean;
    provideLeaves?: boolean;
    excludeEmptyPivotValues?: boolean;
    /** Blank out this dimension on every 7th record, exercising the empty path segment. */
    blankDim?: string;
    /** Aggregator per value field. Anything unlisted is SUM. Also selects the mixed-measure data. */
    aggregators?: Record<string, RefAggKind>;
    /** Bucket strategy rows by the sign of their aggregate pnl. */
    bucket?: boolean;
    /** Connect a Store and assert what the view loads and pushes into it. */
    withStore?: boolean;
    /**
     * Declare a Store field per `result.cellFields` and assert every cell loads through it. Set
     * `denseRecords` to force `Store`'s dense record representation rather than its sparse one - the
     * two resolve an unpopulated cell to its default by different mechanisms.
     */
    withCellStore?: boolean;
    denseRecords?: boolean;
}

/** `experimental.maxPatchRatio` applied when record patching is toggled on. */
const PATCH_RATIO = 0.1;

/**
 * Value fields for the mixed-aggregator scenarios - one per aggregator under test, plus a SUM.
 *
 * `avg` and `avgStrict` are the two that compose from a running `{total, count}` held as aggregator
 * state rather than from their children's published values, so they are the only measures whose
 * correctness depends on an update carrying its *originating leaf's* values all the way up. Plain
 * `AVG` is the sharper of the two: `AVG_STRICT.replace` bails to a full re-aggregate whenever either
 * side of the delta is null, while `AVG.replace` always takes the incremental arm.
 */
const MIXED_FIELDS = ['pnl', 'sumStrict', 'avg', 'avgStrict', 'tag', 'childCount'],
    MIXED_AGGS: Record<string, RefAggKind> = {
        sumStrict: 'SUM_STRICT',
        avg: 'AVG',
        avgStrict: 'AVG_STRICT',
        tag: 'UNIQUE',
        childCount: 'CHILD_COUNT'
    };

const SCENARIOS: Scenario[] = [
    {
        id: 'single',
        label: 'One pivot dim, 3 groupings',
        groupBy: ['fund', 'strategy', 'sector'],
        pivotBy: ['region'],
        valueFields: ['pnl'],
        leaves: 4000
    },
    {
        id: 'multi',
        label: 'Two pivot dims, 3 measures (pivot summaries)',
        groupBy: ['fund', 'strategy'],
        pivotBy: ['region', 'sector'],
        valueFields: ['pnl', 'mktVal', 'quantity'],
        leaves: 4000
    },
    {
        id: 'deep',
        label: 'Three pivot dims',
        groupBy: ['fund', 'strategy'],
        pivotBy: ['region', 'sector', 'strategy2'],
        valueFields: ['pnl'],
        leaves: 4000
    },
    {
        id: 'blanks',
        label: 'Null / blank pivot values',
        groupBy: ['fund', 'strategy'],
        pivotBy: ['region', 'sector'],
        valueFields: ['pnl'],
        leaves: 3000,
        blankDim: 'region'
    },
    {
        id: 'excludeBlanks',
        label: 'excludeEmptyPivotValues filters the group aggregates too',
        groupBy: ['fund', 'strategy'],
        pivotBy: ['region'],
        valueFields: ['pnl'],
        leaves: 3000,
        blankDim: 'region',
        excludeEmptyPivotValues: true
    },
    {
        id: 'leaves',
        label: 'includeLeaves - leaf drill-down',
        groupBy: ['fund', 'strategy'],
        pivotBy: ['region'],
        valueFields: ['pnl'],
        leaves: 2000,
        includeLeaves: true
    },
    {
        id: 'noGroups',
        label: 'No group dims - a single value-summary row',
        groupBy: [],
        pivotBy: ['region', 'sector'],
        valueFields: ['pnl'],
        leaves: 2000
    },
    {
        id: 'noPivots',
        label: 'Empty pivotDimensions degenerates to a plain View',
        groupBy: ['fund', 'strategy'],
        pivotBy: [],
        valueFields: ['pnl'],
        leaves: 2000
    },
    // A leaf feeds both its innermost group row and C(G, fullPath); with a single pivot dimension
    // those leaves are the only rows with two parents, so this isolates that route.
    {
        id: 'aggsOnePivot',
        label: 'Mixed aggregators - one pivot dim (leaf two-parent routing)',
        groupBy: ['fund', 'strategy', 'sector'],
        pivotBy: ['region'],
        valueFields: MIXED_FIELDS,
        aggregators: MIXED_AGGS,
        leaves: 3000,
        withStore: true
    },
    // Two pivot dims put cells themselves on two routes - `parent` up the group axis and
    // `pivotParent` up the pivot axis - which is where an aggregator's `replace` can double count.
    {
        id: 'aggsTwoPivots',
        label: 'Mixed aggregators - two pivot dims (cell two-parent routing)',
        groupBy: ['fund', 'strategy'],
        pivotBy: ['region', 'strategy2'],
        valueFields: MIXED_FIELDS,
        aggregators: MIXED_AGGS,
        leaves: 3000
    },
    // The loadability claim behind `Cells on row data`: cells must arrive in a Store as ordinary
    // fields. Sparse and dense record forms are covered separately - `Store` reaches an unpopulated
    // cell's default through a shared prototype below `denseRecordThreshold` and a cloned template
    // at or above it, so both need asserting.
    {
        id: 'cellStoreSparse',
        label: 'Cells load into a Store - sparse records',
        groupBy: ['fund', 'strategy'],
        pivotBy: ['region'],
        valueFields: ['pnl', 'tag'],
        aggregators: {tag: 'UNIQUE'},
        leaves: 2000,
        withCellStore: true
    },
    {
        id: 'cellStoreDense',
        label: 'Cells load into a Store - dense records',
        groupBy: ['fund', 'strategy'],
        pivotBy: ['region', 'sector'],
        valueFields: MIXED_FIELDS,
        aggregators: MIXED_AGGS,
        leaves: 2000,
        withCellStore: true,
        denseRecords: true
    }
];

/**
 * `updateQuery` with a filter-only change and simple aggregators is the one path where `View`
 * deliberately retains `_rowCache`, so cached rows survive into a rebuild that mints new owner rows
 * and a new pivot path tree. Run separately from `SCENARIOS` - the assertions are transitions.
 */
const FILTER_SCENARIO: Scenario = {
    id: 'filterTransitions',
    label: 'Filter transitions - the row cache survives these',
    groupBy: ['fund', 'strategy'],
    pivotBy: ['region'],
    valueFields: ['pnl'],
    leaves: 3000
};

/** `excludeEmptyPivotValues` folds an implicit filter into the query - the whole bug class needs it. */
const QUERY_SCENARIO: Scenario = {
    id: 'queryIdentity',
    label: 'Query identity and filter augmentation',
    groupBy: ['fund', 'strategy'],
    pivotBy: ['region'],
    valueFields: ['pnl'],
    leaves: 2000,
    blankDim: 'region',
    excludeEmptyPivotValues: true
};

/**
 * `PivotView.createStore` declares and maintains cell fields itself, so nothing here re-declares
 * them - which is the whole point. Three groupings over 10 funds so a structural change confined to
 * one fund leaves most of the tree untouched, making record retention observable.
 */
const STORE_FACTORY_SCENARIO: Scenario = {
    id: 'storeFactory',
    label: 'PivotView.createStore - field sync, connection, record retention',
    groupBy: ['fund', 'strategy', 'sector'],
    pivotBy: ['region'],
    valueFields: ['pnl', 'tag'],
    aggregators: {tag: 'UNIQUE'},
    leaves: 3000
};

/**
 * `updateQuery` transitions that move no pivot *path*. `syncPaths` guarded its early-out on path keys
 * alone, so neither of these republished: `valueFields` moves no key at all, and an empty segment's
 * key is a fixed sentinel independent of `emptyPathLabel`.
 */
const QUERY_TRANSITION_SCENARIO: Scenario = {
    id: 'queryTransitions',
    label: 'Query transitions that leave every path key unchanged',
    groupBy: ['fund', 'strategy'],
    pivotBy: ['region'],
    valueFields: ['pnl', 'mktVal'],
    leaves: 2000,
    blankDim: 'region'
};

/**
 * Dimension transitions re-key rows outright - a grouping change moves every row id, a pivot dimension
 * change moves every path key - yet the row cache is retained across them. Ticks in between are what
 * make a survivor dangerous: a row that sits out a generation misses those updates, so reusing it later
 * publishes values from before the tick. Path keys carry dimension *values* alone, so a cell can even
 * land on a live id under a different pivot dimension.
 *
 * `groupBy` covers every dimension the transitions group by and `fields` names them all up front -
 * gaining a query field invalidates the cache wholesale, which would leave nothing under test.
 */
const DIM_TRANSITION_SCENARIO: Scenario = {
    id: 'dimTransitions',
    label: 'Grouping and pivot dimension transitions',
    groupBy: ['fund', 'strategy', 'sector'],
    pivotBy: ['region'],
    valueFields: ['pnl', 'mktVal'],
    leaves: 2000
};

/** `(dimensions, pivotDimensions)` states walked by {@link DIM_TRANSITION_SCENARIO}, in order. */
const DIM_TRANSITIONS: Array<{label: string; groupBy: string[]; pivotBy: string[]}> = [
    {label: 'initial', groupBy: ['fund', 'strategy', 'sector'], pivotBy: ['region']},
    {label: 'pivot deepened', groupBy: ['fund', 'strategy'], pivotBy: ['region', 'sector']},
    {label: 'pivot swapped', groupBy: ['fund', 'strategy'], pivotBy: ['sector']},
    // Back to the first generation's path keys, with values moved by every tick since.
    {label: 'pivot restored', groupBy: ['fund', 'strategy'], pivotBy: ['region']},
    {label: 'grouping reordered', groupBy: ['sector', 'fund'], pivotBy: ['region']},
    {label: 'grouping restored', groupBy: ['fund', 'strategy', 'sector'], pivotBy: ['region']},
    // Every cell vacated, then every cell back - the path only reachable by emptying the pivot.
    {label: 'pivot emptied', groupBy: ['fund', 'strategy', 'sector'], pivotBy: []},
    {label: 'pivot refilled', groupBy: ['fund', 'strategy', 'sector'], pivotBy: ['region']}
];

/**
 * `generateCells` bails to `clearCells()` whenever the final network holds no group node, and that can
 * follow from a query change `RowCache` prunes nothing for - `includeRoot` is in neither
 * `orphansParents` nor `invalidatesParents`. With no grouping dimensions the root *is* the only group,
 * so dropping it empties the group set while every leaf stays live, cached, and connected.
 *
 * A leaf left pointing at a discarded cell routes its next tick into a dead row. Exposed leaves, so the
 * cell-less state still publishes rows worth comparing.
 */
const CELL_BAIL_SCENARIO: Scenario = {
    id: 'cellBail',
    label: 'Cells discarded while leaves stay live',
    groupBy: [],
    pivotBy: ['region'],
    valueFields: ['pnl'],
    leaves: 1000,
    includeLeaves: true
};

/**
 * Two pivot dims so pivot summaries materialize, two value fields so a leaf path carries a group rather
 * than a bare column. Asserts the built column tree, not a rendered grid - the model needs no DOM.
 */
const PIVOT_GRID_SCENARIO: Scenario = {
    id: 'pivotGrid',
    label: 'PivotGridModel - columns, summaries, and rebuild gating',
    groupBy: ['fund', 'strategy'],
    pivotBy: ['region', 'sector'],
    valueFields: ['pnl', 'mktVal'],
    leaves: 2000
};

/**
 * Plain `View` regression coverage. The phase 2 `data/cube` edits widened members and renamed the
 * incremental update collector without changing non-pivot behavior - which nothing exercised. The
 * reference accumulator is independent of hoist-react, so passing it proves correctness outright,
 * with no `develop` checkout to diff against.
 */
const PLAIN_SCENARIOS: Scenario[] = [
    {
        id: 'plainMixed',
        label: 'Plain View - mixed aggregators, connected Store',
        groupBy: ['fund', 'strategy', 'sector'],
        pivotBy: [],
        valueFields: MIXED_FIELDS,
        aggregators: MIXED_AGGS,
        leaves: 3000,
        withStore: true
    },
    {
        id: 'plainLeaves',
        label: 'Plain View - includeLeaves drill-down',
        groupBy: ['fund', 'strategy'],
        pivotBy: [],
        valueFields: ['pnl'],
        leaves: 2000,
        includeLeaves: true
    },
    {
        id: 'plainProvideLeaves',
        label: 'Plain View - provideLeaves without tree children',
        groupBy: ['fund', 'strategy'],
        pivotBy: [],
        valueFields: ['pnl'],
        leaves: 2000,
        provideLeaves: true
    },
    {
        id: 'plainNoRoot',
        label: 'Plain View - includeRoot off',
        groupBy: ['fund', 'strategy'],
        pivotBy: [],
        valueFields: ['pnl'],
        leaves: 2000,
        includeRoot: false
    },
    {
        id: 'plainBucket',
        label: 'Plain View - bucketSpecFn and its dependent fields',
        groupBy: ['fund', 'strategy'],
        pivotBy: [],
        valueFields: ['pnl'],
        leaves: 2000,
        bucket: true
    }
];

/**
 * `Query.clone` now constructs via `new (this.constructor)`, so a plain Query must still round-trip.
 * Every member here is set away from its `Query` default, so a member dropped from `cloneConfig`
 * shows up as an unequal clone rather than passing on a coincidence.
 */
const PLAIN_QUERY_SCENARIO: Scenario = {
    id: 'plainQuery',
    label: 'Plain View - Query.clone and updateQuery',
    groupBy: ['fund', 'strategy'],
    pivotBy: [],
    valueFields: ['pnl'],
    leaves: 2000,
    provideLeaves: true,
    bucket: true
};

const AGG_FIELDS = ['pnl', 'mktVal', 'quantity'];

/** Cube field specs by name. The mixed-aggregator scenarios draw from the non-SUM entries. */
const FIELD_SPECS: Record<string, {type: 'number' | 'string'; aggregator: AggregatorToken}> = {
    pnl: {type: 'number', aggregator: 'SUM'},
    mktVal: {type: 'number', aggregator: 'SUM'},
    quantity: {type: 'number', aggregator: 'SUM'},
    sumStrict: {type: 'number', aggregator: 'SUM_STRICT'},
    avg: {type: 'number', aggregator: 'AVG'},
    avgStrict: {type: 'number', aggregator: 'AVG_STRICT'},
    tag: {type: 'string', aggregator: 'UNIQUE'},
    childCount: {type: 'number', aggregator: 'CHILD_COUNT'}
};

/**
 * Bucket the strategy level only. A spec returned at every level would nest buckets inside buckets;
 * `dependentFields` is what makes a pnl change re-bucket instead of riding the incremental path.
 */
const BUCKET_SPEC_FN: BucketSpecFn = rows =>
    rows[0]?.data.cubeDimension === 'strategy'
        ? {
              name: 'pnlSign',
              bucketFn: row => (row.data.pnl >= 0 ? 'Gainers' : 'Losers'),
              labelFn: b => b,
              dependentFields: ['pnl']
          }
        : null;

function boolCheck(name: string, ok: boolean, detail?: string): PivotCheck {
    return {name, errors: ok ? [] : [detail ?? 'failed'], checked: 1, maxDrift: 0};
}

export class PivotViewTestModel extends HoistModel {
    @bindable accessor tickPct = 2;

    /**
     * Run every Cube and connected Store on {@link PatchableRecordSet}. The whole suite is expected to
     * pass either way - the flag changes how record sets are derived, not what they hold - so a check
     * that only fails with it on is a bug in the incremental path.
     */
    @bindable accessor patchRecordSets = false;
    // Bindable, not observable: `running` is observed and is set outside an action below - Hoist's
    // bindable setter wraps in one, which `enforceActions: 'observed'` requires.
    @bindable accessor running = false;

    @managed
    gridModel: GridModel = new GridModel({
        store: {idSpec: 'id'},
        sortBy: 'id',
        groupBy: 'scenario',
        emptyText: 'Run the suite to see results.',
        columns: [
            {field: 'scenario', hidden: true},
            {
                field: 'ok',
                headerName: '',
                width: 40,
                align: 'center',
                renderer: v =>
                    v ? Icon.checkCircle({intent: 'success'}) : Icon.xCircle({intent: 'danger'})
            },
            {field: 'name', headerName: 'Check', flex: 2, autosizeMaxWidth: 600},
            {field: 'checked', headerName: 'Values', width: 90, align: 'right'},
            {
                field: 'maxDrift',
                headerName: 'Max drift',
                width: 110,
                align: 'right',
                renderer: v => (v ? v.toExponential(1) : '-')
            },
            {field: 'detail', headerName: 'Failures', flex: 3, autosizeMaxWidth: 900}
        ]
    });

    get failureCount(): number {
        return this.gridModel.store.allRecords.filter(r => !r.data.ok).length;
    }

    get checkCount(): number {
        return this.gridModel.store.allRecords.length;
    }

    async runAllAsync() {
        this.running = true;
        this.gridModel.clear();
        try {
            for (const scenario of SCENARIOS) {
                await this.runScenarioAsync(scenario);
            }
            await this.runFilterScenarioAsync();
            await this.runQueryScenarioAsync();
            await this.runStoreFactoryScenarioAsync();
            await this.runQueryTransitionScenarioAsync();
            await this.runDimTransitionScenarioAsync();
            await this.runCellBailScenarioAsync();
            await this.runPivotGridScenarioAsync();
            for (const scenario of PLAIN_SCENARIOS) {
                await this.runPlainScenarioAsync(scenario);
            }
            await this.runPlainQueryScenarioAsync();

            const {failureCount, checkCount} = this;
            if (failureCount) {
                // Name the first few - a bare count leaves you scrolling ~300 grouped rows to find
                // which check went red.
                const named = this.gridModel.store.allRecords
                    .filter(r => !r.data.ok)
                    .slice(0, 3)
                    .map(r => r.data.name)
                    .join('; ');
                XH.toast({
                    message:
                        `${failureCount} of ${checkCount} checks FAILED: ${named}` +
                        (failureCount > 3 ? ' ...' : ''),
                    intent: 'danger',
                    timeout: 6000
                });
            } else {
                XH.toast({message: `All ${checkCount} checks passed`, intent: 'success'});
            }
        } finally {
            this.running = false;
        }
    }

    //------------------------
    // Implementation
    //------------------------
    private async runScenarioAsync(scenario: Scenario) {
        const {groupBy, pivotBy, valueFields, aggregators} = scenario,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario),
            queryConf = this.buildQueryConf(scenario);

        const cube = this.newCube(fields);
        await cube.loadDataAsync(leaves);

        try {
            // Cell field names only exist once a view has run, so a cell store has to be declared
            // from a probe result - the same ordering PivotGridModel faces observing `cellFields`.
            let store: Store = null;
            if (scenario.withCellStore) {
                const probe = cube.createPivotView({query: queryConf});
                store = this.buildCellStore(probe, scenario);
                XH.safeDestroy(probe);
            } else if (scenario.withStore) {
                store = this.buildStore(valueFields);
            }

            const view = cube.createPivotView({query: queryConf, stores: store, connect: true});

            const refLeaves = scenario.excludeEmptyPivotValues
                ? leaves.filter(l => pivotBy.every(d => l[d] != null && l[d] !== ''))
                : leaves;

            const check = (label: string) =>
                this.record(
                    scenario,
                    checkPivotView({
                        view,
                        leaves: refLeaves,
                        groupBy,
                        pivotBy,
                        valueFields,
                        aggregators,
                        label
                    })
                );

            check('initial');
            // Gated on a CHILD_COUNT field existing, not merely on `aggregators` - the check counts
            // childCount cells and is vacuous, by its own guard, without one.
            if (Object.values(aggregators ?? {}).includes('CHILD_COUNT')) {
                this.record(scenario, [this.checkCellChildCount(view)]);
            }
            if (scenario.includeLeaves && !isEmpty(pivotBy)) {
                this.record(scenario, [this.checkLeafShape(view)]);
            }
            if (scenario.withCellStore) {
                this.record(scenario, checkCellStore({view, store, aggregators, label: 'initial'}));
            } else if (store) {
                this.record(scenario, [
                    this.checkStore(
                        view,
                        store,
                        valueFields,
                        'store: initial load matches the view'
                    )
                ]);
            }

            // Identity stability across a values-only tick is the structural-change signal the grid
            // layer keys off - assert it before and after.
            const pathsBefore = view.result.paths,
                cellFieldsBefore = view.result.cellFields,
                resultBefore = view.result,
                rowsBefore = view.result.rows;

            await this.tickAsync(scenario, leaves, cube);

            // `result` is minted fresh by any update; `result.rows` survives only a data-only one. So
            // the pair pins the tick to `dataOnlyUpdate` - neither a full rebuild nor a no-op that
            // would leave every aggregator's `replace` unexercised.
            this.record(scenario, [
                boolCheck(
                    'tick: took the incremental data-only path',
                    view.result !== resultBefore && view.result.rows === rowsBefore,
                    view.result === resultBefore
                        ? 'nothing was updated - the tick changed no values'
                        : 'rows array was replaced - the tick fell back to a full rebuild'
                ),
                boolCheck(
                    'tick: paths and cellFields keep object identity',
                    view.result.paths === pathsBefore &&
                        view.result.cellFields === cellFieldsBefore,
                    'identity changed on a values-only update'
                )
            ]);

            check('after tick');
            if (scenario.withCellStore) {
                // Cells are mutated onto owner row data after the base class stamps digests, so this
                // is what proves the restamp in loadUpdatedRows actually reaches connected records.
                this.record(
                    scenario,
                    checkCellStore({view, store, aggregators, label: 'after tick'})
                );
            } else if (store) {
                this.record(scenario, [
                    this.checkStore(view, store, valueFields, 'store: tick pushed the changed rows')
                ]);
            }

            // The check the incremental path cannot cheat: same data, built from nothing.
            const rebuilt = cube.createPivotView({query: queryConf});
            this.record(scenario, [
                comparePivotViews(
                    view,
                    rebuilt,
                    valueFields,
                    'tick result matches a full rebuild of the same data',
                    !isEmpty(pivotBy)
                )
            ]);

            XH.safeDestroy(rebuilt);

            // A *pivot* dimension value change is structural too - it re-partitions the cells, so
            // `PivotView.hasDimOrBucketUpdates` must refuse it. Values are reshuffled among those
            // already present, so the path tree is unchanged and only the routing is under test.
            if (!isEmpty(pivotBy)) {
                const dim = pivotBy[pivotBy.length - 1],
                    resultBeforePivot = view.result,
                    rowsBeforePivot = view.result.rows,
                    // Non-empties only, on records already non-empty: `refLeaves` snapshots the
                    // `excludeEmptyPivotValues` filter, so moving a record across that boundary
                    // would stale the reference rather than test anything.
                    pivotValues = uniq(leaves.map(l => l[dim]))
                        .filter(v => v != null && v !== '')
                        .sort();
                leaves.forEach((rec, i) => {
                    const curr = rec[dim];
                    if (i % 9 === 0 && curr != null && curr !== '') {
                        rec[dim] = pivotValues[(i + 1) % pivotValues.length];
                    }
                });
                await cube.updateDataAsync(leaves);

                this.record(scenario, [
                    boolCheck(
                        'pivot dim change: forces a full rebuild',
                        view.result !== resultBeforePivot && view.result.rows !== rowsBeforePivot,
                        view.result === resultBeforePivot
                            ? 'nothing was updated - no pivot value actually moved'
                            : 'rows array held - a structural change rode the incremental path'
                    )
                ]);
                check('after pivot dim change');
            }

            // A brand-new pivot value mints cell fields that did not exist when the store above was
            // declared. Re-declaring from the new `cellFields` and reloading is what PivotGridModel
            // must do on a structural change, and it has to load as cleanly as the first build.
            if (scenario.withCellStore) {
                const dim = pivotBy[pivotBy.length - 1],
                    fieldsBefore = view.result.cellFields;
                leaves.forEach((rec, i) => {
                    if (i % 13 === 0) rec[dim] = 'ZZ-New';
                });
                await cube.updateDataAsync(leaves);

                this.record(scenario, [
                    boolCheck(
                        'new pivot value mints new cell fields',
                        view.result.cellFields !== fieldsBefore &&
                            view.result.cellFields.length > fieldsBefore.length,
                        `cellFields went ${fieldsBefore.length} -> ${view.result.cellFields.length}`
                    )
                ]);

                const widened = this.buildCellStore(view, scenario);
                view.setStores(widened);
                check('after new pivot value');
                this.record(
                    scenario,
                    checkCellStore({
                        view,
                        store: widened,
                        aggregators,
                        label: 'after new pivot value'
                    })
                );
                XH.safeDestroy(widened);
            }

            XH.safeDestroy(view, store);
        } catch (e) {
            this.recordThrow(scenario, e);
        } finally {
            XH.safeDestroy(cube);
        }
    }

    /**
     * Narrow the filter, widen it back, empty it and restore - the transitions a cached cell row can
     * outlive. Toggling the *lexically first* pivot value is what shifts every other value's position
     * in the sorted path order, so a cell reused with a stale path lands a column off.
     */
    private async runFilterScenarioAsync() {
        const scenario = FILTER_SCENARIO,
            {groupBy, pivotBy, valueFields} = scenario,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario),
            queryConf = this.buildQueryConf(scenario);

        const cube = this.newCube(fields);
        await cube.loadDataAsync(leaves);

        try {
            const view = cube.createPivotView({query: queryConf, connect: true}),
                check = (label: string, refLeaves: PlainObject[]) =>
                    this.record(
                        scenario,
                        checkPivotView({
                            view,
                            leaves: refLeaves,
                            groupBy,
                            pivotBy,
                            valueFields,
                            label
                        })
                    );

            check('filter: unfiltered', leaves);

            const first = uniq(leaves.map(l => l.region)).sort()[0];

            view.setFilter({field: 'region', op: '!=', value: [first]});
            check(
                'filter: after narrow',
                leaves.filter(l => l.region !== first)
            );

            view.setFilter(null);
            check('filter: after widen', leaves);

            const rebuilt = cube.createPivotView({query: queryConf});
            this.record(scenario, [
                comparePivotViews(view, rebuilt, valueFields, 'filter: matches a full rebuild')
            ]);
            XH.safeDestroy(rebuilt);

            view.setFilter({field: 'fund', op: '=', value: ['no such fund']});
            this.record(scenario, [
                boolCheck(
                    'filter: narrowing to an empty result clears the cells',
                    isEmpty(view.result.cellFields),
                    `published ${view.result.cellFields.length} cell fields for an empty result`
                )
            ]);

            view.setFilter(null);
            check('filter: after empty and back', leaves);

            XH.safeDestroy(view);
        } catch (e) {
            this.recordThrow(scenario, e);
        } finally {
            XH.safeDestroy(cube);
        }
    }

    /**
     * The implicit `excludeEmptyPivotValues` filter must stay comparable and must not compound, or
     * `updateQuery` can never short-circuit and every clone grows the filter tree by a node.
     */
    private async runQueryScenarioAsync() {
        const scenario = QUERY_SCENARIO,
            {groupBy, pivotBy, valueFields} = scenario,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario);

        const cube = this.newCube(fields);
        await cube.loadDataAsync(leaves);

        try {
            const fund = uniq(leaves.map(l => l.fund)).sort()[0],
                queryConf: PivotQueryConfig = {
                    ...this.buildQueryConf(scenario),
                    filter: {field: 'fund', op: '!=', value: [fund]}
                },
                view = cube.createPivotView({query: queryConf, connect: true}),
                {query} = view;

            this.record(scenario, [
                boolCheck(
                    'query: a clone with no overrides equals the original',
                    query.equals(query.clone({})),
                    'clone re-augmented the already-augmented filter'
                )
            ]);

            const resultBefore = view.result,
                updatedBefore = view.lastUpdated,
                nodesBefore = flattenFilter(view.query.filter).length;

            // Real elapsed time, so a rebuild could not land on the same `lastUpdated` ms.
            await wait(5);
            view.updateQuery({});
            view.updateQuery({});
            view.updateQuery({});

            const nodesAfter = flattenFilter(view.query.filter).length;
            this.record(scenario, [
                boolCheck(
                    'query: a no-op updateQuery does not rebuild',
                    view.result === resultBefore && view.lastUpdated === updatedBefore,
                    `result identity ${view.result === resultBefore ? 'held' : 'changed'}, ` +
                        `lastUpdated ${updatedBefore} -> ${view.lastUpdated}`
                ),
                boolCheck(
                    'query: the exclusion filter does not compound',
                    nodesAfter === nodesBefore,
                    `filter nodes ${nodesBefore} -> ${nodesAfter}`
                )
            ]);

            // A bare FilterTestFn is not an array or object, so a naive isEmpty() check drops it.
            const fnView = cube.createPivotView({
                query: {...this.buildQueryConf(scenario), filter: rec => rec.data.pnl > 0}
            });

            this.record(
                scenario,
                checkPivotView({
                    view: fnView,
                    leaves: leaves.filter(
                        l => l.pnl > 0 && pivotBy.every(d => l[d] != null && l[d] !== '')
                    ),
                    groupBy,
                    pivotBy,
                    valueFields,
                    label: 'query: a bare function filter survives augmentation'
                })
            );

            XH.safeDestroy(view, fnView);
        } catch (e) {
            this.recordThrow(scenario, e);
        } finally {
            XH.safeDestroy(cube);
        }
    }

    /**
     * `PivotView.createStore` declares a Field per cell field and re-declares them itself on every
     * structural change - nothing here does that, which is the whole point. Two connected stores on
     * one view also stand in for the two-`PivotGridModel`s-on-one-view case.
     *
     * Values are asserted through a *non*-projection store: under `projectionOnly` a record's data is
     * the view's own row data object, so any store-vs-view comparison is a row against itself. The
     * projection store carries the record-retention assertion, where identity is the claim.
     */
    private async runStoreFactoryScenarioAsync() {
        const scenario = STORE_FACTORY_SCENARIO,
            {groupBy, pivotBy, valueFields, aggregators} = scenario,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario),
            queryConf = this.buildQueryConf(scenario);

        const cube = this.newCube(fields);
        await cube.loadDataAsync(leaves);

        try {
            const view = cube.createPivotView({query: queryConf, connect: true}),
                {experimental} = this,
                live = view.createStore({connect: true, projectionOnly: false, experimental}),
                proj = view.createStore({connect: true, experimental}),
                snap = view.createStore({projectionOnly: false, experimental});

            const rowCount = () => {
                let n = 0;
                const visit = (row: ViewRowData) => {
                    n++;
                    row.children?.forEach(visit);
                };
                view.result.rows.forEach(visit);
                return n;
            };

            this.record(
                scenario,
                checkPivotView({
                    view,
                    leaves,
                    groupBy,
                    pivotBy,
                    valueFields,
                    aggregators,
                    label: 'initial'
                })
            );
            this.record(scenario, [
                this.checkDeclaredFields(view, live, 'createStore: declares every cell field'),
                boolCheck(
                    'createStore: loads immediately from the current result',
                    live.allCount > 0 && live.allCount + 1 === rowCount(),
                    `${live.allCount} records + root for ${rowCount()} view rows`
                ),
                // loadStores publishes exactly the one root node carrying `children` that this flag
                // wants, so the app's remaining value-summary wiring is just GridModel.showSummary.
                boolCheck(
                    'createStore: loadRootAsSummary mirrors includeRoot',
                    live.loadRootAsSummary && live.summaryRecords?.length === 1,
                    `loadRootAsSummary ${live.loadRootAsSummary}, ` +
                        `${live.summaryRecords?.length ?? 0} summary records`
                )
            ]);
            this.record(
                scenario,
                checkCellStore({view, store: live, aggregators, label: 'createStore'})
            );

            // Real elapsed time, so an untouched store could not hold `lastUpdated` by coincidence.
            await wait(5);
            const liveUpdated = live.lastUpdated,
                snapUpdated = snap.lastUpdated;
            await this.tickAsync(scenario, leaves, cube);

            this.record(scenario, [
                boolCheck(
                    'createStore: connect false loads once and never again',
                    snap.lastUpdated === snapUpdated && live.lastUpdated !== liveUpdated,
                    live.lastUpdated === liveUpdated
                        ? 'the connected store did not update either - the tick was a no-op'
                        : `unconnected store updated at ${snap.lastUpdated}`
                )
            ]);
            this.record(
                scenario,
                checkCellStore({view, store: live, aggregators, label: 'after tick'})
            );

            // Confine a new pivot value to one fund of ten, so most of the tree is untouched and its
            // rows keep their digests - which is what makes record retention observable at all.
            const fund = uniq(leaves.map(l => l.fund)).sort()[0],
                cellFieldsBefore = view.result.cellFields;
            leaves.forEach(rec => {
                if (rec.fund === fund) rec.region = 'ZZ-New';
            });
            await cube.updateDataAsync(leaves);

            this.record(scenario, [
                boolCheck(
                    'structural change: mints new cell fields',
                    view.result.cellFields !== cellFieldsBefore &&
                        view.result.cellFields.length > cellFieldsBefore.length,
                    `cellFields went ${cellFieldsBefore.length} -> ${view.result.cellFields.length}`
                ),
                this.checkDeclaredFields(
                    view,
                    live,
                    'structural change: the view re-declares fields unaided'
                )
            ]);
            this.record(
                scenario,
                checkCellStore({view, store: live, aggregators, label: 'after new pivot value'})
            );

            view.disconnectStore(live);
            await wait(5);
            const disconnectedAt = live.lastUpdated,
                projUpdated = proj.lastUpdated;
            await this.tickAsync(scenario, leaves, cube, 2);

            this.record(scenario, [
                boolCheck(
                    'disconnectStore: stops further loads',
                    live.lastUpdated === disconnectedAt && proj.lastUpdated !== projUpdated,
                    proj.lastUpdated === projUpdated
                        ? 'the still-connected store did not update either - the tick was a no-op'
                        : `disconnected store updated at ${live.lastUpdated}`
                )
            ]);

            XH.safeDestroy(view, live, proj, snap);
        } catch (e) {
            this.recordThrow(scenario, e);
        } finally {
            XH.safeDestroy(cube);
        }
    }

    /**
     * Neither of these transitions moves a path key, so both slipped past `syncPaths`' early-out and
     * left the view publishing cell fields and labels for a query it no longer had.
     */
    private async runQueryTransitionScenarioAsync() {
        const scenario = QUERY_TRANSITION_SCENARIO,
            {groupBy, pivotBy, valueFields} = scenario,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario),
            queryConf = this.buildQueryConf(scenario);

        const cube = this.newCube(fields);
        await cube.loadDataAsync(leaves);

        try {
            const view = cube.createPivotView({query: queryConf, connect: true}),
                keysOf = () => view.result.cellFields.map(cf => cf.name),
                pathKeys = () => view.result.paths.map(p => p.key);

            const keysBefore = keysOf(),
                pathKeysBefore = pathKeys();

            // Drop a value field. Every path key holds, so only the cell fields should move.
            view.updateQuery({valueFields: [valueFields[0]]});

            this.record(scenario, [
                boolCheck(
                    'valueFields change: cell fields drop the removed measure',
                    isEqual(pathKeys(), pathKeysBefore) &&
                        keysOf().length === keysBefore.length / 2 &&
                        !keysOf().some(name => name.endsWith(valueFields[1])),
                    `cellFields ${keysBefore.length} -> ${keysOf().length}, ` +
                        `still naming ${valueFields[1]}: ${keysOf().some(n => n.endsWith(valueFields[1]))}`
                )
            ]);
            this.record(
                scenario,
                checkPivotView({
                    view,
                    leaves,
                    groupBy,
                    pivotBy,
                    valueFields: [valueFields[0]],
                    label: 'after valueFields change'
                })
            );

            // Restore it. Cells aggregate `valueFields` alone, so a measure the *query* fields already
            // carried is one no field-gain check can see - a retained cell has simply never computed
            // it, and reports null for every cell of the restored column.
            this.tickMeasures(leaves, 1);
            await cube.updateDataAsync(leaves);
            view.updateQuery({valueFields});
            this.record(
                scenario,
                checkPivotView({
                    view,
                    leaves,
                    groupBy,
                    pivotBy,
                    valueFields,
                    label: 'after valueFields restored'
                })
            );

            // Relabel the empty segment. Its key is a fixed sentinel, so no key moves here either.
            const emptyBefore = view.result.paths.filter(p => p.isEmpty).map(p => p.label);
            view.updateQuery({emptyPathLabel: '(none)'});
            const emptyAfter = view.result.paths.filter(p => p.isEmpty).map(p => p.label);

            this.record(scenario, [
                boolCheck(
                    'emptyPathLabel change: relabels the empty path segment',
                    !isEmpty(emptyAfter) &&
                        emptyAfter.every(l => l === '(none)') &&
                        !isEqual(emptyAfter, emptyBefore),
                    `empty labels ${JSON.stringify(emptyBefore)} -> ${JSON.stringify(emptyAfter)}` +
                        (isEmpty(emptyAfter) ? ' - no empty segment, scenario proves nothing' : '')
                )
            ]);

            XH.safeDestroy(view);
        } catch (e) {
            this.recordThrow(scenario, e);
        } finally {
            XH.safeDestroy(cube);
        }
    }

    /**
     * Walk one connected view through {@link DIM_TRANSITIONS}, ticking values between every state and
     * asserting each against the reference and against a view built from nothing. A cached row that
     * survives a transition it should not shows up as a value from before the last tick.
     */
    private async runDimTransitionScenarioAsync() {
        const scenario = DIM_TRANSITION_SCENARIO,
            {valueFields} = scenario,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario),
            // Every dimension any transition uses, so no transition gains a query field.
            allDims = uniq(DIM_TRANSITIONS.flatMap(t => [...t.groupBy, ...t.pivotBy])),
            queryConf: PivotQueryConfig = {
                ...this.buildQueryConf(scenario),
                fields: uniq([...allDims, ...AGG_FIELDS, ...valueFields])
            };

        const cube = this.newCube(fields);
        await cube.loadDataAsync(leaves);

        try {
            const view = cube.createPivotView({query: queryConf, connect: true});
            let loads = 0,
                patched = 0;

            for (let i = 0; i < DIM_TRANSITIONS.length; i++) {
                const {label, groupBy, pivotBy} = DIM_TRANSITIONS[i],
                    conf: PivotQueryConfig = {
                        ...queryConf,
                        dimensions: groupBy,
                        pivotDimensions: pivotBy
                    };

                if (i) {
                    this.tickMeasures(leaves, i);
                    // Alternate the two routes into a connected view. A reload diffs the incoming
                    // records itself, which is the one path a patched record set can express as a
                    // patch without a digest - so this is where that flag earns anything at all.
                    if (i % 2) {
                        await cube.loadDataAsync(leaves);
                        loads++;
                        if (cube.store.diagnostics.load.last?.type === 'patched') patched++;
                    } else {
                        await cube.updateDataAsync(leaves);
                    }
                    view.updateQuery({dimensions: groupBy, pivotDimensions: pivotBy});
                }

                this.record(
                    scenario,
                    checkPivotView({
                        view,
                        leaves,
                        groupBy,
                        pivotBy,
                        valueFields,
                        label: `dims: ${label}`
                    })
                );

                const rebuilt = cube.createPivotView({query: conf});
                this.record(scenario, [
                    comparePivotViews(
                        view,
                        rebuilt,
                        valueFields,
                        `dims: ${label} matches a full rebuild`,
                        !isEmpty(pivotBy)
                    )
                ]);
                XH.safeDestroy(rebuilt);
            }

            // A patch ratio that never patches is only bookkeeping - the reloads above must reach
            // the incremental path, or nothing here has actually exercised the flag.
            this.record(scenario, [
                boolCheck(
                    'dims: reloads stayed on the incremental patch path',
                    !this.patchRecordSets || patched > 0,
                    `patched ${patched} of ${loads} reloads`
                )
            ]);

            XH.safeDestroy(view);
        } catch (e) {
            this.recordThrow(scenario, e);
        } finally {
            XH.safeDestroy(cube);
        }
    }

    /**
     * Walk a pivoted view into and back out of a generation that builds no cells at all, ticking in
     * both states. See {@link CELL_BAIL_SCENARIO} for why `includeRoot` is the lever.
     *
     * The failure is a throw out of `projectCell`, not a wrong value - the discarded cell resolves no
     * field names - so the assertions either side of the tick exist to prove the scenario actually
     * reached the bail rather than passing because nothing happened.
     */
    private async runCellBailScenarioAsync() {
        const scenario = CELL_BAIL_SCENARIO,
            {groupBy, pivotBy, valueFields} = scenario,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario),
            queryConf = this.buildQueryConf(scenario);

        const cube = this.newCube(fields);
        await cube.loadDataAsync(leaves);

        try {
            const view = cube.createPivotView({query: queryConf, connect: true});

            this.record(scenario, [
                boolCheck(
                    'cell bail: the root group builds cells to begin with',
                    !isEmpty(view.result.cellFields),
                    'no cells were built - nothing below proves anything'
                )
            ]);

            view.updateQuery({includeRoot: false});

            this.record(scenario, [
                boolCheck(
                    'cell bail: dropping the only group discards every cell',
                    isEmpty(view.result.cellFields) && isEmpty(view.result.paths),
                    `cellFields ${view.result.cellFields.length}, ` +
                        `paths ${view.result.paths.length} - the bail was not reached`
                )
            ]);

            // The tick that follows a leaf's stale `pivotParent` into a discarded cell.
            await this.tickAsync(scenario, leaves, cube, 1);

            const flat = cube.createPivotView({query: {...queryConf, includeRoot: false}});
            this.record(scenario, [
                comparePivotViews(
                    view,
                    flat,
                    valueFields,
                    'cell bail: ticking with no cells matches a full rebuild',
                    false
                )
            ]);
            XH.safeDestroy(flat);

            // Back to a group node. The pivot route has to re-establish - a cell-less generation must
            // not sever it permanently, which is the other way a fix here could go wrong.
            view.updateQuery({includeRoot: true});
            await this.tickAsync(scenario, leaves, cube, 2);

            this.record(
                scenario,
                checkPivotView({
                    view,
                    leaves,
                    groupBy,
                    pivotBy,
                    valueFields,
                    label: 'cell bail: cells restored'
                })
            );

            XH.safeDestroy(view);
        } catch (e) {
            this.recordThrow(scenario, e);
        } finally {
            XH.safeDestroy(cube);
        }
    }

    /**
     * The rewired `PivotGridModel` against the column tree it builds. No grid is mounted - the model
     * needs no DOM, and the structure is the thing under test.
     */
    private async runPivotGridScenarioAsync() {
        const scenario = PIVOT_GRID_SCENARIO,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario),
            queryConf = this.buildQueryConf(scenario);

        // A pivot value carrying the path delimiter and the escape char. The published cell field
        // name escapes both, so a grid that *reconstructed* names from `path.key` instead of reading
        // `cellFields` would bind columns nothing writes to.
        leaves.forEach((rec, i) => {
            if (i % 11 === 0) rec.sector = 'A>>B';
            if (i % 17 === 0) rec.sector = 'C\\D';
        });

        const cube = this.newCube(fields);
        await cube.loadDataAsync(leaves);

        try {
            const view = cube.createPivotView({query: queryConf, connect: true}),
                model = new PivotGridModel({
                    view,
                    rowSummary: true,
                    pivotSummary: true,
                    valueSummary: true
                }),
                {gridModel} = model;

            const valueColIds = () =>
                    gridModel
                        .getLeafColumns()
                        .map(it => it.colId)
                        .filter(id => id !== 'cubeLabel'),
                cellNames = () => view.result.cellFields.map(cf => cf.name);

            // With both summaries on, the value columns are exactly the published cell fields - every
            // path at every depth, including the root. That pins naming, coverage and placement in
            // one assertion, and it can only hold if colIds come from `cellFields` themselves.
            const ids = valueColIds(),
                names = cellNames();
            this.record(scenario, [
                boolCheck(
                    'columns: one value column per published cell field',
                    isEqual([...ids].sort(), [...names].sort()),
                    `${ids.length} value columns for ${names.length} cell fields; extra ` +
                        `[${difference(ids, names).slice(0, 3)}], missing [${difference(names, ids).slice(0, 3)}]`
                ),
                boolCheck(
                    "columns: row summaries bind the value fields' own names",
                    view.query.valueFields.every(f => ids.includes(f.name)),
                    `missing [${difference(
                        view.query.valueFields.map(f => f.name),
                        ids
                    )}]`
                ),
                boolCheck(
                    'columns: valueSummary wires includeRoot through to showSummary',
                    gridModel.showSummary === 'top',
                    `showSummary is ${gridModel.showSummary}`
                )
            ]);

            // Turning pivot summaries off must drop exactly the partial-path cells, and nothing else.
            model.pivotSummary = false;
            const partials = view.result.cellFields
                .filter(cf => !cf.path.isRoot && !isEmpty(cf.path.children))
                .map(cf => cf.name);
            this.record(scenario, [
                boolCheck(
                    'columns: pivotSummary gates exactly the partial-path cells',
                    !isEmpty(partials) &&
                        isEqual([...valueColIds()].sort(), [...difference(names, partials)].sort()),
                    isEmpty(partials)
                        ? 'no partial paths - scenario cannot prove the gate'
                        : `${valueColIds().length} columns, expected ${names.length - partials.length}`
                )
            ]);
            model.pivotSummary = true;

            // Side placement, and the `true` -> default-side resolution behind it. Column 0 is
            // always the tree label column.
            const groupIdAt = (i: number) => (model.gridModel.columns.at(i) as any)?.groupId;
            model.rowSummary = 'left';
            const leftPlaced = groupIdAt(1);
            model.rowSummary = true;
            const rightPlaced = groupIdAt(-1);

            this.record(scenario, [
                boolCheck(
                    'rowSummary: a side places the column, and true resolves to right',
                    leftPlaced === 'rowSummary' && rightPlaced === 'rowSummary',
                    `left put ${leftPlaced} first, true put ${rightPlaced} last`
                )
            ]);

            // Display sort must build its own order and never touch the immutable published tree.
            const pathsBefore = view.result.paths,
                treeBefore = JSON.stringify(pathsBefore.map(p => p.children.map(c => c.key))),
                ascOrder = this.topGroupIds(model);
            model.pivotSortBy = ['desc'];
            const descOrder = this.topGroupIds(model);

            this.record(scenario, [
                boolCheck(
                    'pivotSortBy: reorders the top-level column groups',
                    ascOrder.length > 1 && isEqual(descOrder, [...ascOrder].reverse()),
                    `asc ${JSON.stringify(ascOrder)} vs desc ${JSON.stringify(descOrder)}`
                ),
                boolCheck(
                    'pivotSortBy: leaves result.paths untouched',
                    view.result.paths === pathsBefore &&
                        JSON.stringify(pathsBefore.map(p => p.children.map(c => c.key))) ===
                            treeBefore,
                    "display sorting mutated the view's own path tree"
                )
            ]);
            model.pivotSortBy = [];

            // A values-only tick must not touch columns - `setColumns` resets column state, so a
            // rebuild per tick would discard the user's widths and pinning on every update.
            const colsBefore = gridModel.columns;
            await this.tickAsync(scenario, leaves, cube);
            this.record(scenario, [
                boolCheck(
                    'rebuild: a values-only tick does not rebuild columns',
                    gridModel.columns === colsBefore,
                    'columns were rebuilt on a tick'
                )
            ]);

            // A new pivot value is structural - the column for its cells must appear.
            leaves.forEach((rec, i) => {
                if (i % 13 === 0) rec.sector = 'ZZ-New';
            });
            await cube.updateDataAsync(leaves);

            this.record(scenario, [
                boolCheck(
                    'rebuild: a new pivot value adds its columns',
                    gridModel.columns !== colsBefore &&
                        isEqual([...valueColIds()].sort(), [...cellNames()].sort()) &&
                        valueColIds().some(id => id.includes('ZZ-New')),
                    `${valueColIds().length} columns for ${cellNames().length} cell fields`
                )
            ]);

            const {store} = model;
            XH.safeDestroy(model);
            this.record(scenario, [
                boolCheck(
                    'destroy: disconnects its store from the view',
                    !view.stores.includes(store),
                    "the view still holds the destroyed grid's store"
                )
            ]);

            XH.safeDestroy(view);
        } catch (e) {
            this.recordThrow(scenario, e);
        } finally {
            XH.safeDestroy(cube);
        }
    }

    /** Header names of the top-level pivot column groups, in display order. */
    private topGroupIds(model: PivotGridModel): string[] {
        return model.gridModel.columns
            .filter(it => 'children' in it && it.groupId !== 'rowSummary')
            .map((it: any) => it.groupId);
    }

    /**
     * Plain `View` against the same reference: the initial build, an incremental values tick, a
     * structural dimension change, and a full rebuild for comparison.
     */
    private async runPlainScenarioAsync(scenario: Scenario) {
        const {groupBy, valueFields, aggregators, bucket} = scenario,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario),
            queryConf = this.buildPlainQueryConf(scenario);

        const cube = this.newCube(fields);
        await cube.loadDataAsync(leaves);

        try {
            const store = scenario.withStore ? this.buildStore(valueFields) : null,
                view = cube.createView({query: queryConf, stores: store, connect: true}),
                check = (label: string) =>
                    this.record(
                        scenario,
                        checkPivotView({
                            view,
                            leaves,
                            groupBy,
                            pivotBy: [],
                            valueFields,
                            aggregators,
                            label
                        })
                    );

            check('initial');
            this.record(scenario, this.checkLeafExposure(scenario, view, leaves));
            if (store) {
                this.record(scenario, [
                    this.checkStore(
                        view,
                        store,
                        valueFields,
                        'store: initial load matches the view'
                    )
                ]);
            }

            const resultBefore = view.result,
                rowsBefore = view.result.rows;
            await this.tickAsync(scenario, leaves, cube);

            // `bucketFn` reads pnl, which the tick moves - a declared dependent field must force the
            // full rebuild that re-buckets, rather than riding the incremental path.
            const rowsHeld = view.result.rows === rowsBefore;
            this.record(scenario, [
                boolCheck(
                    bucket
                        ? 'tick: a bucket dependent field forces a full rebuild'
                        : 'tick: took the incremental data-only path',
                    view.result !== resultBefore && (bucket ? !rowsHeld : rowsHeld),
                    view.result === resultBefore
                        ? 'nothing was updated - the tick changed no values'
                        : `rows array ${rowsHeld ? 'held' : 'was replaced'}`
                )
            ]);
            check('after tick');
            if (store) {
                this.record(scenario, [
                    this.checkStore(view, store, valueFields, 'store: tick pushed the changed rows')
                ]);
            }

            const rebuilt = cube.createView({query: queryConf});
            this.record(scenario, [
                comparePivotViews(view, rebuilt, valueFields, 'tick matches a full rebuild', false)
            ]);
            XH.safeDestroy(rebuilt);

            // A grouping dimension value change is structural - `getSimpleUpdates` must refuse it.
            const resultBeforeDim = view.result,
                rowsBeforeDim = view.result.rows,
                dimValues = uniq(leaves.map(l => l[groupBy[0]])).sort();
            leaves.forEach((rec, i) => {
                if (i % 11 === 0) rec[groupBy[0]] = dimValues[(i + 1) % dimValues.length];
            });
            await cube.updateDataAsync(leaves);

            this.record(scenario, [
                boolCheck(
                    'dim change: forces a full rebuild',
                    view.result !== resultBeforeDim && view.result.rows !== rowsBeforeDim,
                    view.result === resultBeforeDim
                        ? 'nothing was updated - no dimension value actually moved'
                        : 'rows array held - a structural change rode the incremental path'
                )
            ]);
            check('after dim change');

            XH.safeDestroy(view, store);
        } catch (e) {
            this.recordThrow(scenario, e);
        } finally {
            XH.safeDestroy(cube);
        }
    }

    /** `Query.clone`, `equals`, and `updateQuery`'s no-op short circuit on a plain Query. */
    private async runPlainQueryScenarioAsync() {
        const scenario = PLAIN_QUERY_SCENARIO,
            {groupBy, valueFields} = scenario,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario);

        const cube = this.newCube(fields);
        await cube.loadDataAsync(leaves);

        try {
            const fund = uniq(leaves.map(l => l.fund)).sort()[0],
                queryConf: QueryConfig = {
                    ...this.buildPlainQueryConf(scenario),
                    filter: {field: 'fund', op: '!=', value: [fund]}
                },
                view = cube.createView({query: queryConf, connect: true}),
                {query} = view,
                clone = query.clone({});

            const check = (label: string, refLeaves: PlainObject[]) =>
                this.record(
                    scenario,
                    checkPivotView({
                        view,
                        leaves: refLeaves,
                        groupBy,
                        pivotBy: [],
                        valueFields,
                        label
                    })
                );

            check(
                'query: filtered build',
                leaves.filter(l => l.fund !== fund)
            );

            this.record(scenario, [
                boolCheck(
                    'query: a clone with no overrides equals the original',
                    clone !== query && query.equals(clone),
                    'clone did not round-trip every member'
                ),
                boolCheck(
                    'query: a clone keeps the Query class',
                    clone.constructor === query.constructor,
                    `clone is a ${clone.constructor?.name}, original a ${query.constructor?.name}`
                ),
                boolCheck(
                    'query: an overridden clone is unequal',
                    !query.equals(query.clone({includeLeaves: !query.includeLeaves})),
                    'overrides did not reach the clone'
                )
            ]);

            const resultBefore = view.result,
                updatedBefore = view.lastUpdated;

            // Real elapsed time, so a rebuild could not land on the same `lastUpdated` ms.
            await wait(5);
            view.updateQuery({});

            this.record(scenario, [
                boolCheck(
                    'query: a no-op updateQuery does not rebuild',
                    view.result === resultBefore && view.lastUpdated === updatedBefore,
                    `result identity ${view.result === resultBefore ? 'held' : 'changed'}, ` +
                        `lastUpdated ${updatedBefore} -> ${view.lastUpdated}`
                )
            ]);

            // A filter-only change with simple aggregators is the path that retains `_rowCache`.
            view.setFilter(null);
            check('query: after clearing the filter', leaves);

            const rebuilt = cube.createView({query: this.buildPlainQueryConf(scenario)});
            this.record(scenario, [
                comparePivotViews(
                    view,
                    rebuilt,
                    valueFields,
                    'query: matches a full rebuild',
                    false
                )
            ]);

            XH.safeDestroy(view, rebuilt);
        } catch (e) {
            this.recordThrow(scenario, e);
        } finally {
            XH.safeDestroy(cube);
        }
    }

    /**
     * Perturb measures in place and push them through the Cube. `gen` must advance on a second tick
     * within one scenario - both perturbations are a pure function of it, so re-running the same
     * generation moves nothing and any "did the store update" assertion becomes a no-op.
     */
    private async tickAsync(scenario: Scenario, leaves: PlainObject[], cube: Cube, gen = 1) {
        if (scenario.aggregators) {
            this.applyMixedMeasures(leaves, gen);
        } else {
            tickLeaves(leaves, Math.max(1, Math.round((leaves.length * this.tickPct) / 100)), gen);
        }
        await cube.updateDataAsync(leaves);
    }

    /**
     * Exposed leaf data must keep a single own-key shape across every leaf.
     *
     * Cell values on a leaf are prototype getters over one own `_pivotPathIdx` slot, not per-leaf
     * properties. Writing them instead gives each leaf a different subset of own keys - one hidden
     * class per full-depth pivot path - and `Column.buildFastValueGetter` compiles one closure per
     * column that group rows and leaf rows both flow through, so a drill-down would push that call
     * site megamorphic for the whole grid. Own keys are the only observable proof either way.
     */
    private checkLeafShape(view: PivotView): PivotCheck {
        const check: PivotCheck = {
                name: 'exposed leaves all share one own-key shape',
                errors: [],
                checked: 0,
                maxDrift: 0
            },
            cellNames = new Set(
                view.result.cellFields.filter(cf => !cf.path.isRoot).map(cf => cf.name)
            );

        let sig: string = null;
        view.result.leafMap?.forEach(leaf => {
            const keys = Object.keys(leaf.data).sort(),
                mine = keys.join('|');
            check.checked++;

            if (sig == null) {
                sig = mine;
            } else if (mine !== sig && check.errors.length < 3) {
                check.errors.push(`leaf ${leaf.id} own keys [${mine}] differ from [${sig}]`);
            }

            const leaked = keys.filter(k => cellNames.has(k));
            if (!isEmpty(leaked) && check.errors.length < 5) {
                check.errors.push(`leaf ${leaf.id} carries cell fields as own keys: ${leaked}`);
            }
        });

        if (!check.checked) check.errors.push('no exposed leaves - check is vacuous');
        return check;
    }

    /**
     * `CHILD_COUNT` on a cell counts child *groups carrying that path*, so it must not simply mirror
     * its group row's own child count - otherwise the reference comparison could be satisfied by a
     * copy of the group value.
     */
    private checkCellChildCount(view: PivotView): PivotCheck {
        const names = view.result.cellFields
                .filter(cf => cf.valueField.name === 'childCount' && cf.path.depth === 1)
                .map(cf => cf.name),
            check: PivotCheck = {
                name: 'CHILD_COUNT on a cell differs from its group row',
                errors: [],
                checked: 0,
                maxDrift: 0
            };

        let differs = 0;
        const visit = (row: ViewRowData) => {
            if (row.cubeRowType === 'aggregate') {
                names.forEach(name => {
                    check.checked++;
                    if (row[name] != null && row[name] !== row.childCount) differs++;
                });
            }
            row.children?.forEach(visit);
        };
        view.result.rows.forEach(visit);

        if (!check.checked) check.errors.push('no childCount cells were published');
        else if (!differs) {
            check.errors.push('every populated cell count equalled its group row count');
        }
        return check;
    }

    /** Every cell field the view published, plus its row-meta and query fields, declared on `store`. */
    private checkDeclaredFields(view: PivotView, store: Store, name: string): PivotCheck {
        const check: PivotCheck = {name, errors: [], checked: 0, maxDrift: 0},
            want = [
                'cubeLabel',
                'cubeDimension',
                ...view.fieldNames,
                ...view.result.cellFields.map(cf => cf.name)
            ];

        want.forEach(fieldName => {
            check.checked++;
            if (!store.getField(fieldName) && check.errors.length < 5) {
                check.errors.push(`field '${fieldName}' not declared on the store`);
            }
        });
        if (!check.checked) check.errors.push('nothing was compared');
        return check;
    }

    /**
     * A connected Store must hold every value the view published - on the initial load, and after a
     * tick pushes the rows it touched. Cell rows are never published, so only group rows appear.
     */
    private checkStore(view: View, store: Store, valueFields: string[], name: string): PivotCheck {
        const check: PivotCheck = {name, errors: [], checked: 0, maxDrift: 0},
            visit = (row: ViewRowData) => {
                const rec = store.getById(row.id);
                if (!rec) {
                    if (check.errors.length < 5) {
                        check.errors.push(`row ${row.id} absent from the connected store`);
                    }
                } else {
                    valueFields.forEach(field => {
                        check.checked++;
                        const want = row[field] ?? null,
                            got = rec.data[field] ?? null;
                        if (!isEqual(want, got) && check.errors.length < 5) {
                            check.errors.push(`${row.id} ${field}: view ${want}, store ${got}`);
                        }
                    });
                }
                row.children?.forEach(visit);
            };

        view.result.rows.forEach(visit);
        if (!check.checked) check.errors.push('nothing was compared');
        return check;
    }

    /**
     * `createResult` publishes `leafMap` only when the query exposes leaves - hidden leaves adopt Cube
     * record data outright and must never escape. `provideLeaves` additionally has to reach those
     * leaves without making them tree children.
     */
    private checkLeafExposure(scenario: Scenario, view: View, leaves: PlainObject[]): PivotCheck[] {
        const {
                includeLeaves = false,
                provideLeaves = false,
                groupBy,
                includeRoot = true
            } = scenario,
            {leafMap} = view.result,
            exposed = includeLeaves || provideLeaves,
            ret: PivotCheck[] = [
                boolCheck(
                    `leafMap is ${exposed ? 'published' : 'withheld'}`,
                    exposed ? leafMap?.size === leaves.length : leafMap == null,
                    `leafMap ${leafMap ? `size ${leafMap.size}` : 'null'} for ${leaves.length} leaves`
                )
            ];

        if (provideLeaves && !includeLeaves) {
            let innermost = 0,
                withChildren = 0,
                viaHelper = 0;

            const visit = (row: ViewRowData, depth: number) => {
                if (depth === groupBy.length) {
                    innermost++;
                    if (row.children) withChildren++;
                    viaHelper += castArray(getCubeLeaves(row)).length;
                }
                row.children?.forEach(child => visit(child, depth + 1));
            };
            view.result.rows.forEach(row => visit(row, includeRoot ? 0 : 1));

            ret.push(
                boolCheck(
                    'provideLeaves reaches leaves without exposing them as children',
                    innermost > 0 && !withChildren && viaHelper === leaves.length,
                    `${innermost} innermost rows, ${withChildren} with children, ` +
                        `${viaHelper} leaves via getCubeLeaves for ${leaves.length} records`
                )
            );
        }
        return ret;
    }

    /**
     * `omitRedundantNodes` off so the visible tree maps 1:1 to group dimension prefixes, which is
     * what the reference walk assumes.
     */
    private buildQueryConf(scenario: Scenario): PivotQueryConfig {
        const {pivotBy, valueFields} = scenario;
        return {
            ...this.buildPlainQueryConf(scenario),
            pivotDimensions: pivotBy,
            valueFields,
            excludeEmptyPivotValues: scenario.excludeEmptyPivotValues,
            maxPivotPaths: null
        };
    }

    private buildPlainQueryConf(scenario: Scenario): QueryConfig {
        const {
            groupBy,
            pivotBy,
            valueFields,
            includeRoot = true,
            includeLeaves = false,
            provideLeaves = false
        } = scenario;
        return {
            dimensions: groupBy,
            fields: uniq([...groupBy, ...pivotBy, ...AGG_FIELDS, ...valueFields]),
            includeRoot,
            includeLeaves,
            provideLeaves,
            omitRedundantNodes: false,
            bucketSpecFn: scenario.bucket ? BUCKET_SPEC_FN : null
        };
    }

    private newCube(fields: CubeFieldSpec[]): Cube {
        return new Cube({fields, idSpec: 'id', store: {experimental: this.experimental}});
    }

    private get experimental(): PlainObject {
        return {maxPatchRatio: this.patchRecordSets ? PATCH_RATIO : 0};
    }

    /**
     * A Store declaring one Field per published cell field, taking `type` from each entry's source
     * measure exactly as {@link PivotCellField} intends. `defaultValue` is left at null, which is what
     * an unpopulated cell must resolve to.
     *
     * `denseRecordThreshold` forces the record representation: 1 makes every record dense (defaults
     * via a cloned template), a value above the field count makes every record sparse (defaults via a
     * shared prototype). Both must resolve an absent cell to null.
     */
    private buildCellStore(view: PivotView, scenario: Scenario): Store {
        const {cellFields} = view.result;
        return new Store({
            idSpec: 'id',
            fields: cellFields.map(cf => ({name: cf.name, type: cf.valueField.type})),
            experimental: {
                ...this.experimental,
                denseRecordThreshold: scenario.denseRecords ? 1 : cellFields.length + 100
            }
        });
    }

    /**
     * Deliberately not `projectionOnly`, despite View recommending it for connected stores: that has
     * records adopt the view's row data objects, so `checkStore` would compare each row against
     * itself and pass vacuously.
     */
    private buildStore(valueFields: string[]): Store {
        return new Store({
            idSpec: 'id',
            fields: valueFields.map(name => ({name, type: 'auto' as const})),
            experimental: this.experimental
        });
    }

    private buildLeaves(scenario: Scenario): PlainObject[] {
        const profile = {...getProfile('typical'), leaves: scenario.leaves},
            ret = generateLeaves(profile as any);

        // A second low-cardinality dimension for the three-pivot scenario.
        ret.forEach((rec, i) => (rec.strategy2 = `S2-${i % 3}`));

        if (scenario.aggregators) this.applyMixedMeasures(ret, 0);

        if (scenario.blankDim) {
            ret.forEach((rec, i) => {
                if (i % 7 === 0) rec[scenario.blankDim] = i % 14 === 0 ? null : '';
            });
        }
        return ret;
    }

    /**
     * Move a slice of the measures, as a function of `gen` so successive ticks never repeat. Kept
     * under {@link PATCH_RATIO} so a patched record set can express the change as a patch rather
     * than flattening into a fresh base.
     */
    private tickMeasures(leaves: PlainObject[], gen: number) {
        leaves.forEach((rec, i) => {
            if (i % 25 !== gen % 25) return;
            rec.pnl = ((i * 37) % 5000) - 2500 + gen * 13;
            rec.mktVal = ((i * 53) % 90000) + gen * 7;
        });
    }

    /**
     * Measures for the mixed-aggregator scenarios, as a function of a generation counter so a tick
     * moves values, the null subtree, and the non-unique subtree together. Both are *concentrated*
     * rather than sprinkled: sprinkled nulls make every strict aggregate null, and a sprinkled tag
     * makes every UNIQUE aggregate null, which would leave the checks comparing null to null.
     */
    private applyMixedMeasures(leaves: PlainObject[], gen: number) {
        const funds = uniq(leaves.map(l => l.fund)).sort(),
            regions = uniq(leaves.map(l => l.region)).sort(),
            nullFund = funds[gen % funds.length],
            nullRegion = regions[gen % regions.length],
            movedFund = funds[(gen + 3) % funds.length];

        leaves.forEach((rec, i) => {
            const nulled = rec.fund === nullFund && rec.region === nullRegion,
                bump = i % 7 === gen % 7 ? gen * 11 : 0;

            rec.sumStrict = nulled ? null : (i % 97) - 40 + bump;
            rec.avgStrict = nulled ? null : ((i * 13) % 53) + 1 + bump;
            // Plain AVG skips nulls rather than nulling the aggregate, so unlike the strict measures
            // its nulls are sprinkled - and they *move* with `gen`, so leaves cross the boundary both
            // ways and the running count has to follow the delta rather than just the total.
            rec.avg = i % 11 === gen % 11 ? null : ((i * 29) % 71) + 1 + bump;
            rec.tag = rec.fund === movedFund && i % 13 === 0 ? 'MOVED' : rec.fund;
        });
    }

    private buildFields(scenario: Scenario): CubeFieldSpec[] {
        const dimNames = uniq([...scenario.groupBy, ...scenario.pivotBy, 'strategy2']),
            measures = uniq([...AGG_FIELDS, ...scenario.valueFields]).filter(
                name => !dimNames.includes(name)
            );

        return [
            ...dimNames.map(name => ({name, type: 'string' as const, isDimension: true})),
            ...measures.map(name => ({name, ...FIELD_SPECS[name]}))
        ];
    }

    private recordThrow(scenario: Scenario, e: unknown) {
        this.record(scenario, [
            {name: 'threw', errors: [(e as Error).message ?? String(e)], checked: 0, maxDrift: 0}
        ]);
    }

    private record(scenario: Scenario, checks: PivotCheck[]) {
        const {store} = this.gridModel;
        checks.forEach(check => {
            store.updateData({
                add: [
                    {
                        id: `${scenario.id}-${check.name}`,
                        scenario: scenario.label,
                        name: check.name,
                        ok: isEmpty(check.errors),
                        checked: check.checked,
                        maxDrift: check.maxDrift,
                        detail: check.errors.join(' | ')
                    }
                ]
            });
        });
    }
}
