import type {PlainObject} from '@xh/hoist/core';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import type {PivotPath, PivotQuery, PivotView} from '@xh/hoist/data';
import {Cube, Store} from '@xh/hoist/data';
import {action, bindable, observable, observableRef} from '@xh/hoist/mobx';
import {isEmpty} from 'lodash';

/**
 * A hand-sized `PivotView`, dumped as JSON at every stage so the whole pipeline can be read by eye.
 *
 * The data is eight records with values 10, 20, ... 80, which makes every aggregate verifiable by
 * mental arithmetic: on the one-pivot preset, Fund 1 / Strat A reads US 10, EU 20, Total 30, and the
 * value-totals row reads US 160, EU 200, Total 360.
 *
 * `storeJson` is the payload after a real round trip through a `Store` declaring one Field per
 * published `cellFields` entry - i.e. the load path a `PivotGridModel` will use, not a reformatting
 * of `result.rows`.
 */
export class PivotInspectModel extends HoistModel {
    /** 1 pivot dimension (region), or 2 (region then sector) to materialize pivot totals. */
    @bindable accessor pivotDepth: number = 1;

    /** Drop one record so a cell is unpopulated - it must read null, not undefined or zero. */
    @bindable accessor sparse = false;

    /** Publish the value-totals row. */
    @bindable accessor includeRoot = true;

    /** Expose leaf records as tree children under their innermost group. */
    @bindable accessor includeLeaves = false;

    @observable accessor queryJson = '';
    @observable accessor rawJson = '';
    @observable accessor rowsJson = '';
    @observable accessor pathsJson = '';
    @observable accessor cellFieldsJson = '';
    @observable accessor storeJson = '';
    @observableRef accessor status = '';

    @managed private cube: Cube;
    @managed private view: PivotView;
    @managed private store: Store;
    private leaves: PlainObject[] = [];
    private tickCount = 0;

    constructor() {
        super();

        // Reaction rather than per-control onChange: those fire before the bound value commits, so a
        // rebuild triggered from one reads the previous config.
        this.addReaction({
            track: () => [this.pivotDepth, this.sparse, this.includeRoot, this.includeLeaves],
            run: () => this.buildAsync(),
            fireImmediately: true
        });
    }

    async buildAsync() {
        const {pivotDepth, sparse, includeRoot, includeLeaves} = this;

        XH.safeDestroy(this.view, this.store, this.cube);
        this.tickCount = 0;

        const pivotDimensions = pivotDepth === 2 ? ['region', 'sector'] : ['region'],
            dimensions = pivotDepth === 2 ? ['fund'] : ['fund', 'strategy'],
            query = {
                dimensions,
                pivotDimensions,
                valueFields: ['pnl'],
                includeRoot,
                includeLeaves
            };

        this.leaves = this.buildLeaves(pivotDepth, sparse);

        this.cube = new Cube({
            idSpec: 'id',
            fields: [
                {name: 'fund', type: 'string', isDimension: true},
                {name: 'strategy', type: 'string', isDimension: true},
                {name: 'region', type: 'string', isDimension: true},
                {name: 'sector', type: 'string', isDimension: true},
                {name: 'pnl', type: 'number', aggregator: 'SUM'}
            ]
        });
        await this.cube.loadDataAsync(this.leaves);

        // Two passes, because cell field names only exist once a view has run - exactly the ordering
        // PivotGridModel faces when it observes `result.cellFields` to declare its Store fields.
        const probe = this.cube.createPivotView({query});
        const cellFields = probe.result.cellFields;
        XH.safeDestroy(probe);

        this.store = new Store({
            idSpec: 'id',
            loadTreeData: true,
            fields: cellFields.map(cf => ({name: cf.name, type: cf.valueField.type}))
        });

        this.view = this.cube.createPivotView({query, stores: this.store, connect: true});

        this.publish(`Built: ${this.leaves.length} records, ${cellFields.length} cell fields`);
    }

    /** Perturb one record by +100 so an incremental tick can be traced through every stage. */
    async tickAsync() {
        if (isEmpty(this.leaves)) return;

        this.tickCount++;
        const target = this.leaves[0];
        target.pnl += 100;
        await this.cube.updateDataAsync({update: [{...target}]});

        this.publish(
            `Tick ${this.tickCount}: record ${target.id} pnl +100 (now ${target.pnl}) - every ` +
                `aggregate above it should move by 100`
        );
    }

    //------------------------
    // Implementation
    //------------------------
    @action
    private publish(status: string) {
        const {view, store} = this,
            {paths, cellFields, rows} = view.result;

        this.status = status;
        this.queryJson = json(querySummary(view.query));
        this.rawJson = json(this.leaves);
        this.rowsJson = json(rows, rowReplacer);
        this.pathsJson = json(paths.map(pathSummary));
        this.cellFieldsJson = json(
            cellFields.map(cf => ({
                name: cf.name,
                pathKey: cf.path.isRoot ? '' : cf.path.key,
                pathLabel: cf.path.isRoot ? '(root - the row total)' : cf.path.label,
                valueField: cf.valueField.name,
                type: cf.valueField.type
            }))
        );

        // Read back out of the Store, so this is the pivoted output as a Grid would receive it -
        // parsed into records against the declared cell fields, not the view's own row objects.
        this.storeJson = json(
            store.allRecords.map(rec => ({
                id: rec.id,
                ...omitKeys(rec.data, ['id', 'children', '_cubeLeafChildren'])
            }))
        );
    }

    /** Eight records, values 10..80, so every aggregate is checkable by mental arithmetic. */
    private buildLeaves(pivotDepth: number, sparse: boolean): PlainObject[] {
        const ret: PlainObject[] = [];
        let pnl = 0;

        if (pivotDepth === 2) {
            // groupBy fund; pivot region >> sector. Parent-path cells are the pivot totals.
            for (const fund of ['Fund 1', 'Fund 2']) {
                for (const region of ['US', 'EU']) {
                    for (const sector of ['Eq', 'Fi']) {
                        pnl += 10;
                        ret.push({
                            id: `r${ret.length + 1}`,
                            fund,
                            strategy: 'Strat A',
                            region,
                            sector,
                            pnl
                        });
                    }
                }
            }
        } else {
            for (const fund of ['Fund 1', 'Fund 2']) {
                for (const strategy of ['Strat A', 'Strat B']) {
                    for (const region of ['US', 'EU']) {
                        pnl += 10;
                        ret.push({
                            id: `r${ret.length + 1}`,
                            fund,
                            strategy,
                            region,
                            sector: 'Eq',
                            pnl
                        });
                    }
                }
            }
        }

        // Drop the last record, leaving its (group, path) cell unpopulated.
        return sparse ? ret.slice(0, -1) : ret;
    }
}

function json(value: any, replacer?: (key: string, value: any) => any): string {
    return JSON.stringify(value, replacer, 2);
}

/**
 * The resolved query as `PivotView` holds it - names rather than `CubeField`s, since each of those
 * references the whole Cube. `dimensions` is the row hierarchy and stays unconcatenated with
 * `pivotDimensions`; `fields` is the full aggregated set, of which `valueFields` are the measures
 * sliced across the pivot axis.
 */
function querySummary(query: PivotQuery): PlainObject {
    return {
        dimensions: query.dimensions.map(f => f.name),
        pivotDimensions: query.pivotDimensions.map(f => f.name),
        valueFields: query.valueFields.map(f => f.name),
        fields: query.fields.map(
            f => `${f.name}${f.aggregator ? ` (${f.aggregator.constructor.name})` : ''}`
        ),
        isPivoted: query.isPivoted,
        includeRoot: query.includeRoot,
        includeLeaves: query.includeLeaves,
        provideLeaves: query.provideLeaves,
        omitRedundantNodes: query.omitRedundantNodes,
        emptyPathLabel: query.emptyPathLabel,
        excludeEmptyPivotValues: query.excludeEmptyPivotValues,
        maxPivotPaths: query.maxPivotPaths,
        hasFilter: query.hasFilter,
        filter: query.filter?.toJSON?.() ?? null,
        lockFn: fnLabel(query.lockFn),
        bucketSpecFn: fnLabel(query.bucketSpecFn),
        omitFn: fnLabel(query.omitFn)
    };
}

function fnLabel(fn: any): string {
    return fn ? '(set)' : null;
}

/** CubeField carries its whole cube - summarize rather than dump it. */
function pathSummary(path: PivotPath): PlainObject {
    return {
        key: path.key,
        depth: path.depth,
        dimension: path.dimension?.name ?? null,
        value: path.value,
        label: path.label,
        isEmpty: path.isEmpty,
        children: path.children.map(pathSummary)
    };
}

/** Drop the internal leaf back-reference - not part of the published contract. */
function rowReplacer(key: string, value: any) {
    return key === '_cubeLeafChildren' ? undefined : value;
}

function omitKeys(obj: PlainObject, keys: string[]): PlainObject {
    const ret: PlainObject = {};
    for (const k in obj) {
        if (!keys.includes(k)) ret[k] = obj[k];
    }
    return ret;
}
