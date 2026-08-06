import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {
    AggregatorToken,
    BucketSpecFn,
    Cube,
    CubeFieldSpec,
    flattenFilter,
    PivotQueryConfig,
    PivotView,
    QueryConfig,
    Store,
    View,
    ViewRowData
} from '@xh/hoist/data';
import {bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {wait} from '@xh/hoist/promise';
import {castArray, isEmpty, isEqual, uniq} from 'lodash';
import {generateLeaves, getProfile, tickLeaves} from './PivotBenchData';
import {checkPivotView, comparePivotViews, PivotCheck, RefAggKind} from './PivotViewCheck';

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
}

/** Value fields for the mixed-aggregator scenarios - one per aggregator under test, plus a SUM. */
const MIXED_FIELDS = ['pnl', 'sumStrict', 'avgStrict', 'tag', 'childCount'],
    MIXED_AGGS: Record<string, RefAggKind> = {
        sumStrict: 'SUM_STRICT',
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
        label: 'Two pivot dims, 3 measures (pivot totals)',
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
        label: 'No group dims - a single value-totals row',
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
    @bindable tickPct = 2;
    @observable running = false;

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
                    v
                        ? Icon.checkCircle({intent: 'success', asHtml: true})
                        : Icon.xCircle({intent: 'danger', asHtml: true})
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

    constructor() {
        super();
        makeObservable(this);
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
            for (const scenario of PLAIN_SCENARIOS) {
                await this.runPlainScenarioAsync(scenario);
            }
            await this.runPlainQueryScenarioAsync();

            const {failureCount, checkCount} = this;
            if (failureCount) {
                XH.toast({
                    message: `${failureCount} of ${checkCount} checks FAILED`,
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

        const cube = new Cube({fields, idSpec: 'id'});
        await cube.loadDataAsync(leaves);

        try {
            const store = scenario.withStore ? this.buildStore(valueFields) : null,
                view = cube.createPivotView({query: queryConf, stores: store, connect: true});

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
            if (aggregators) this.record(scenario, [this.checkCellChildCount(view)]);
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
            if (store) {
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

        const cube = new Cube({fields, idSpec: 'id'});
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

        const cube = new Cube({fields, idSpec: 'id'});
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
     * Plain `View` against the same reference: the initial build, an incremental values tick, a
     * structural dimension change, and a full rebuild for comparison.
     */
    private async runPlainScenarioAsync(scenario: Scenario) {
        const {groupBy, valueFields, aggregators, bucket} = scenario,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario),
            queryConf = this.buildPlainQueryConf(scenario);

        const cube = new Cube({fields, idSpec: 'id'});
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

        const cube = new Cube({fields, idSpec: 'id'});
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

    /** Perturb measures in place and push them through the Cube. */
    private async tickAsync(scenario: Scenario, leaves: PlainObject[], cube: Cube) {
        if (scenario.aggregators) {
            this.applyMixedMeasures(leaves, 1);
        } else {
            tickLeaves(leaves, Math.max(1, Math.round((leaves.length * this.tickPct) / 100)));
        }
        await cube.updateDataAsync(leaves);
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
                viaGetter = 0;

            const visit = (row: ViewRowData, depth: number) => {
                if (depth === groupBy.length) {
                    innermost++;
                    if (row.children) withChildren++;
                    viaGetter += castArray(row.cubeLeaves).length;
                }
                row.children?.forEach(child => visit(child, depth + 1));
            };
            view.result.rows.forEach(row => visit(row, includeRoot ? 0 : 1));

            ret.push(
                boolCheck(
                    'provideLeaves reaches leaves without exposing them as children',
                    innermost > 0 && !withChildren && viaGetter === leaves.length,
                    `${innermost} innermost rows, ${withChildren} with children, ` +
                        `${viaGetter} leaves via cubeLeaves for ${leaves.length} records`
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

    private buildStore(valueFields: string[]): Store {
        return new Store({
            idSpec: 'id',
            fields: valueFields.map(name => ({name, type: 'auto' as const}))
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
