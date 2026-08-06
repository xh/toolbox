import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, PlainObject, XH} from '@xh/hoist/core';
import {Cube, PivotCellField, PivotView, Store} from '@xh/hoist/data';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {isEmpty} from 'lodash';

/**
 * A hand-sized `PivotView`, laid out so its every intermediate can be checked by eye.
 *
 * The data is eight records with values 10, 20, ... 80, which makes every aggregate verifiable by
 * mental arithmetic: on the one-pivot preset, Fund 1 / Strat A reads US 10, EU 20, Total 30, and the
 * value-totals row reads US 160, EU 200, Total 360.
 *
 * The pivoted grid is bound to a Store connected to the view, with one Field declared per published
 * `cellFields` entry - i.e. it is the real load path a `PivotGridModel` will use, not a rendering of
 * `result.rows` by other means.
 */
export class PivotInspectModel extends HoistModel {
    /** 1 pivot dimension (region), or 2 (region then sector) to materialize pivot totals. */
    @bindable pivotDepth: number = 1;

    /** Drop one record so a cell is unpopulated - it must read null, not undefined or zero. */
    @bindable sparse = false;

    /** Publish the value-totals row. */
    @bindable includeRoot = true;

    /** Expose leaf records as tree children under their innermost group. */
    @bindable includeLeaves = false;

    @observable.ref cellFields: PivotCellField[] = [];
    @observable.ref rowJson: string = '';
    @observable.ref status: string = '';

    @managed rawGridModel: GridModel;
    /** Replaced per build - its columns come from the result, so it must be observable to swap. */
    @managed @observable.ref pivotGridModel: GridModel;
    @managed pathGridModel: GridModel;
    @managed fieldGridModel: GridModel;

    @managed private cube: Cube;
    @managed private view: PivotView;
    @managed private store: Store;
    private leaves: PlainObject[] = [];
    private tickCount = 0;

    constructor() {
        super();
        makeObservable(this);

        this.rawGridModel = new GridModel({
            store: {idSpec: 'id'},
            sortBy: 'id',
            emptyText: 'Press Build.',
            columns: [
                {field: 'id', width: 60},
                {field: 'fund', width: 90},
                {field: 'strategy', width: 90},
                {field: 'region', width: 90},
                {field: 'sector', width: 90},
                {field: 'pnl', width: 80, align: 'right'}
            ]
        });

        this.pathGridModel = new GridModel({
            store: {idSpec: 'key'},
            emptyText: 'Press Build.',
            columns: [
                {field: 'depth', headerName: 'Depth', width: 70, align: 'right'},
                {field: 'key', headerName: 'key', width: 170},
                {field: 'dimension', headerName: 'dimension', width: 110},
                {field: 'value', headerName: 'value (raw)', width: 120},
                {field: 'label', headerName: 'label', width: 120},
                {field: 'isEmpty', headerName: 'isEmpty', width: 90}
            ]
        });

        this.fieldGridModel = new GridModel({
            store: {idSpec: 'name'},
            emptyText: 'Press Build.',
            columns: [
                {field: 'name', headerName: 'Store field name', width: 210},
                {field: 'pathKey', headerName: 'path.key', width: 170},
                {field: 'valueField', headerName: 'valueField', width: 120},
                {field: 'type', headerName: 'type', width: 90}
            ]
        });

        // Rebuilt on every build - its columns and Store fields come from the result.
        this.pivotGridModel = this.buildPivotGridModel([]);

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

        const pivotBy = pivotDepth === 2 ? ['region', 'sector'] : ['region'],
            groupBy = pivotDepth === 2 ? ['fund'] : ['fund', 'strategy'];

        this.leaves = this.buildLeaves(pivotDepth, sparse);
        this.rawGridModel.loadData(this.leaves);

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
        const probe = this.cube.createPivotView({
            query: {
                dimensions: groupBy,
                pivotDimensions: pivotBy,
                valueFields: ['pnl'],
                includeRoot,
                includeLeaves
            }
        });
        const cellFields = probe.result.cellFields;
        XH.safeDestroy(probe);

        this.store = new Store({
            idSpec: 'id',
            loadTreeData: true,
            fields: cellFields.map(cf => ({name: cf.name, type: cf.valueField.type}))
        });

        this.view = this.cube.createPivotView({
            query: {
                dimensions: groupBy,
                pivotDimensions: pivotBy,
                valueFields: ['pnl'],
                includeRoot,
                includeLeaves
            },
            stores: this.store,
            connect: true
        });

        this.installPivotGrid(cellFields);

        this.publish(`Built: ${this.leaves.length} records, ${cellFields.length} cell fields`);
    }

    /** Perturb one record by +100 so an incremental tick can be watched land in the grid. */
    async tickAsync() {
        if (isEmpty(this.leaves)) return;

        this.tickCount++;
        const target = this.leaves[0];
        target.pnl += 100;
        await this.cube.updateDataAsync({update: [{...target}]});

        // Reload the raw grid too, or the input shown no longer matches what was aggregated.
        this.rawGridModel.loadData(this.leaves);
        this.pivotGridModel.store.loadData(this.view.result.rows as any);
        this.publish(
            `Tick ${this.tickCount}: record ${target.id} pnl +100 (now ${target.pnl}) - every ` +
                `aggregate above it should move by 100`
        );
    }

    //------------------------
    // Implementation
    //------------------------
    @action
    private installPivotGrid(cellFields: PivotCellField[]) {
        XH.safeDestroy(this.pivotGridModel);
        this.pivotGridModel = this.buildPivotGridModel(cellFields);
        this.pivotGridModel.store.loadData(this.view.result.rows as any);
    }

    @action
    private publish(status: string) {
        const {view} = this,
            {paths, cellFields, rows} = view.result;

        this.cellFields = cellFields;
        this.status = status;

        this.pathGridModel.loadData(
            this.flattenPaths(paths).map(p => ({
                key: p.isRoot ? '(root)' : p.key,
                depth: p.depth,
                dimension: p.dimension?.name ?? '-',
                value: p.isRoot ? '-' : String(p.value),
                label: p.isRoot ? '-' : p.label,
                isEmpty: p.isEmpty
            }))
        );

        this.fieldGridModel.loadData(
            cellFields.map(cf => ({
                name: cf.name,
                pathKey: cf.path.isRoot ? '(root - the row total)' : cf.path.key,
                valueField: cf.valueField.name,
                type: cf.valueField.type
            }))
        );

        // The published row data verbatim - the object a Store would be handed, so an absent cell
        // shows as an absent key rather than as a null.
        this.rowJson = JSON.stringify(rows, jsonReplacer, 2);
    }

    private buildPivotGridModel(cellFields: PivotCellField[]): GridModel {
        return new GridModel({
            treeMode: true,
            store: {
                idSpec: 'id',
                loadTreeData: true,
                fields: cellFields.map(cf => ({name: cf.name, type: cf.valueField.type}))
            },
            emptyText: 'Press Build.',
            sizingMode: 'compact',
            expandLevel: 99,
            // Autosize (the default for a managed grid) squeezes the tree column past legibility.
            autosizeOptions: {mode: 'disabled'},
            columns: [
                {field: 'cubeLabel', headerName: 'Group', width: 260, isTreeColumn: true},
                ...cellFields.map(cf => ({
                    field: cf.name,
                    headerName: cf.path.isRoot ? 'TOTAL' : cf.path.key,
                    headerTooltip: `Store field '${cf.name}' - ${
                        cf.path.isRoot ? 'the row total' : `path '${cf.path.key}'`
                    }`,
                    width: cf.path.isRoot ? 110 : 100,
                    align: 'right' as const
                }))
            ]
        });
    }

    /** Eight records, values 10..80, so every aggregate is checkable by mental arithmetic. */
    private buildLeaves(pivotDepth: number, sparse: boolean): PlainObject[] {
        const ret: PlainObject[] = [];
        let pnl = 0;

        if (pivotDepth === 2) {
            // groupBy fund; pivot region >> sector. Parent-path columns are the pivot totals.
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

    private flattenPaths(paths: any[]): any[] {
        const ret = [];
        const visit = (p: any) => {
            ret.push(p);
            p.children?.forEach(visit);
        };
        paths.forEach(visit);
        return ret;
    }
}

/** Drop the internal leaf back-reference, which is circular and not part of the published contract. */
function jsonReplacer(key: string, value: any) {
    return key === '_cubeLeafChildren' ? undefined : value;
}
