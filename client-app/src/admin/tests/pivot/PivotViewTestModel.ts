import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {Cube, CubeFieldSpec, flattenFilter, PivotQueryConfig} from '@xh/hoist/data';
import {bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {wait} from '@xh/hoist/promise';
import {isEmpty, uniq} from 'lodash';
import {generateLeaves, getProfile, tickLeaves} from './PivotBenchData';
import {checkPivotView, comparePivotViews, PivotCheck} from './PivotViewCheck';

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
    excludeEmptyPivotValues?: boolean;
    /** Blank out this dimension on every 7th record, exercising the empty path segment. */
    blankDim?: string;
}

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

const AGG_FIELDS = ['pnl', 'mktVal', 'quantity'];

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
        const {groupBy, pivotBy, valueFields} = scenario,
            leaves = this.buildLeaves(scenario),
            fields = this.buildFields(scenario),
            queryConf = this.buildQueryConf(scenario);

        const cube = new Cube({fields, idSpec: 'id'});
        await cube.loadDataAsync(leaves);

        try {
            const view = cube.createPivotView({query: queryConf, connect: true});

            const refLeaves = scenario.excludeEmptyPivotValues
                ? leaves.filter(l => pivotBy.every(d => l[d] != null && l[d] !== ''))
                : leaves;

            this.record(
                scenario,
                checkPivotView({
                    view,
                    leaves: refLeaves,
                    groupBy,
                    pivotBy,
                    valueFields,
                    label: 'initial'
                })
            );

            // Identity stability across a values-only tick is the structural-change signal the grid
            // layer keys off - assert it before and after.
            const pathsBefore = view.result.paths,
                cellFieldsBefore = view.result.cellFields;

            const tickCount = Math.max(1, Math.round((leaves.length * this.tickPct) / 100));
            tickLeaves(leaves, tickCount);
            await cube.updateDataAsync(leaves);

            this.record(scenario, [
                boolCheck(
                    'tick: paths and cellFields keep object identity',
                    view.result.paths === pathsBefore &&
                        view.result.cellFields === cellFieldsBefore,
                    'identity changed on a values-only update'
                )
            ]);

            this.record(
                scenario,
                checkPivotView({
                    view,
                    leaves: refLeaves,
                    groupBy,
                    pivotBy,
                    valueFields,
                    label: 'after tick'
                })
            );

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

            XH.safeDestroy(view, rebuilt);
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
     * `omitRedundantNodes` off so the visible tree maps 1:1 to group dimension prefixes, which is
     * what the reference walk assumes.
     */
    private buildQueryConf(scenario: Scenario): PivotQueryConfig {
        const {groupBy, pivotBy, valueFields, includeRoot = true, includeLeaves = false} = scenario;
        return {
            dimensions: groupBy,
            pivotDimensions: pivotBy,
            valueFields,
            fields: uniq([...groupBy, ...pivotBy, ...AGG_FIELDS]),
            includeRoot,
            includeLeaves,
            omitRedundantNodes: false,
            excludeEmptyPivotValues: scenario.excludeEmptyPivotValues,
            maxPivotPaths: null
        };
    }

    private buildLeaves(scenario: Scenario): PlainObject[] {
        const profile = {...getProfile('typical'), leaves: scenario.leaves},
            ret = generateLeaves(profile as any);

        // A second low-cardinality dimension for the three-pivot scenario.
        ret.forEach((rec, i) => (rec.strategy2 = `S2-${i % 3}`));

        if (scenario.blankDim) {
            ret.forEach((rec, i) => {
                if (i % 7 === 0) rec[scenario.blankDim] = i % 14 === 0 ? null : '';
            });
        }
        return ret;
    }

    private buildFields(scenario: Scenario): CubeFieldSpec[] {
        const dimNames = [...scenario.groupBy, ...scenario.pivotBy, 'strategy2'].filter(
            (v, i, a) => a.indexOf(v) === i
        );
        return [
            ...dimNames.map(name => ({name, type: 'string' as const, isDimension: true})),
            ...AGG_FIELDS.map(name => ({
                name,
                type: 'number' as const,
                aggregator: 'SUM' as const
            }))
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
