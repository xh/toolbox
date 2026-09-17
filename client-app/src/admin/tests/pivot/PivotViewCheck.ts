import {PlainObject} from '@xh/hoist/core';
import {PivotCellField, PivotPath, PivotViewResult, Store, View, ViewRowData} from '@xh/hoist/data';
import {isEmpty, isEqual, isNumber} from 'lodash';

/**
 * Correctness assertions for {@link View} and {@link PivotView}, checked against values accumulated
 * directly from the raw leaf records. The unit suite in hoist-react
 * (`data/cube/impl/PivotStructure.spec.ts`) proves the structure combinatorics; this proves the parts
 * that need the live framework - real aggregators over real rows, cell projection onto row data, and
 * the incremental tick path.
 *
 * The reference is aggregator-aware (see {@link RefAggKind}) and is written from each aggregator's
 * documented semantics rather than from its code, so it stays an independent oracle - a scenario
 * declares the aggregator it expects, and a mis-mapped token or a broken `replace` surfaces here.
 *
 * Floating point: aggregation order differs between the reference and the Cube, and the incremental
 * path accumulates `curr - old + new` deltas, so numeric values are compared to a relative tolerance
 * and the worst observed drift is reported rather than hidden. Integer child counts and UNIQUE values
 * go through an exact comparison instead - a tolerance there would hide a real miss.
 *
 * Reference keys length-prefix each segment (`encode`), so no dimension value can forge a key
 * boundary - or impersonate an empty - and make two distinct groups collide into a false pass.
 */

const TOLERANCE = 1e-6;

/** Aggregators the reference reproduces. Scenarios declare one per value field. */
export type RefAggKind = 'SUM' | 'SUM_STRICT' | 'AVG' | 'AVG_STRICT' | 'UNIQUE' | 'CHILD_COUNT';

export interface PivotCheck {
    name: string;
    errors: string[];
    /** Values compared, so a silently-empty check is visible rather than passing vacuously. */
    checked: number;
    maxDrift: number;
}

export interface PivotCheckConfig {
    view: View;
    leaves: PlainObject[];
    groupBy: string[];
    /** Empty for a plain, non-pivoted View. */
    pivotBy: string[];
    valueFields: string[];
    /** Aggregator per value field. Anything unlisted is taken as SUM. */
    aggregators?: Record<string, RefAggKind>;
    /** Label distinguishing this run, e.g. 'initial' or 'after tick'. */
    label: string;
}

function isEmptyVal(value: any): boolean {
    return value == null || value === '';
}

/**
 * Injective: real segments carry their length so no value can forge a boundary, and an empty takes a
 * length no real segment can produce - so no value can impersonate one either.
 */
function encode(key: string, value: any, isEmpty = isEmptyVal(value)): string {
    if (isEmpty) return `${key}-1:`;
    const seg = String(value);
    return `${key}${seg.length}:${seg}`;
}

interface RefStat {
    sum: number;
    /** Non-null values seen. */
    count: number;
    anyNull: boolean;
    first: any;
    unique: boolean;
}

/** One structure node `C(G, P)`, keyed `groupKey + '/' + pivotKey`. */
interface RefNode {
    leaves: number;
    /** Distinct values of the *next* group dimension - this node's group-axis child count. */
    groupChildren: Set<string>;
    /** Distinct values of the *next* pivot dimension - this node's pivot-axis child count. */
    pivotChildren: Set<string>;
    stats: RefStat[];
}

function newNode(fieldCount: number): RefNode {
    const stats: RefStat[] = [];
    for (let i = 0; i < fieldCount; i++) {
        stats.push({sum: 0, count: 0, anyNull: false, first: null, unique: true});
    }
    return {leaves: 0, groupChildren: new Set(), pivotChildren: new Set(), stats};
}

/** Per-node statistics over the raw leaves, sufficient to reproduce every {@link RefAggKind}. */
function accumulate({leaves, groupBy, pivotBy, valueFields}: PivotCheckConfig) {
    const ret = new Map<string, RefNode>(),
        gDepth = groupBy.length,
        pDepth = pivotBy.length;

    for (const leaf of leaves) {
        let gKey = '';
        for (let g = 0; g <= gDepth; g++) {
            if (g > 0) gKey = encode(gKey, leaf[groupBy[g - 1]]);
            const gChild = g < gDepth ? encode('', leaf[groupBy[g]]) : null;

            let pKey = '';
            for (let p = 0; p <= pDepth; p++) {
                if (p > 0) pKey = encode(pKey, leaf[pivotBy[p - 1]]);
                const pChild = p < pDepth ? encode('', leaf[pivotBy[p]]) : null;

                const key = `${gKey}/${pKey}`;
                let node = ret.get(key);
                if (!node) ret.set(key, (node = newNode(valueFields.length)));

                const isFirst = ++node.leaves === 1;
                if (gChild != null) node.groupChildren.add(gChild);
                if (pChild != null) node.pivotChildren.add(pChild);

                for (let v = 0; v < valueFields.length; v++) {
                    const stat = node.stats[v],
                        raw = leaf[valueFields[v]] ?? null;

                    if (raw == null) {
                        stat.anyNull = true;
                    } else {
                        stat.sum += raw;
                        stat.count++;
                    }

                    if (isFirst) stat.first = raw;
                    else if (stat.unique && !isEqual(raw, stat.first)) stat.unique = false;
                }
            }
        }
    }
    return ret;
}

/**
 * A group node decomposes on exactly one axis - the group axis unless it is innermost, and then the
 * pivot axis. The root path is the exception: `C(G, rootPath)` *is* `G`, which keeps its real row-tree
 * children. So a cell's CHILD_COUNT counts child *groups carrying that path*, which is the intended
 * semantic rather than a broken one.
 */
function childCount(node: RefNode, g: number, p: number, gDepth: number, pDepth: number): number {
    if (g < gDepth) return node.groupChildren.size;
    return p > 0 && p < pDepth ? node.pivotChildren.size : node.leaves;
}

function expected(
    node: RefNode,
    v: number,
    kind: RefAggKind,
    g: number,
    p: number,
    gDepth: number,
    pDepth: number
): any {
    if (!node) return null;
    if (kind === 'CHILD_COUNT') return childCount(node, g, p, gDepth, pDepth);

    const stat = node.stats[v];
    switch (kind) {
        case 'SUM':
            return stat.count ? stat.sum : null;
        case 'SUM_STRICT':
            return stat.anyNull ? null : stat.sum;
        case 'AVG':
            return stat.count ? stat.sum / stat.count : null;
        case 'AVG_STRICT':
            return stat.anyNull ? null : stat.sum / stat.count;
        case 'UNIQUE':
            return stat.unique ? stat.first : null;
    }
}

/** Exact for anything non-numeric, so string measures do not fall into the numeric tolerance path. */
function close(a: any, b: any): boolean {
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    if (!isNumber(a) || !isNumber(b)) return isEqual(a, b);
    return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1) <= TOLERANCE;
}

function drift(a: any, b: any): number {
    if (!isNumber(a) || !isNumber(b)) return 0;
    return Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1);
}

function mkCheck(name: string): PivotCheck {
    return {name, errors: [], checked: 0, maxDrift: 0};
}

function compare(check: PivotCheck, expected: any, actual: any, describe: () => string) {
    check.checked++;
    check.maxDrift = Math.max(check.maxDrift, drift(expected, actual));
    if (!close(expected, actual) && check.errors.length < 5) {
        check.errors.push(`${describe()}: expected ${expected}, got ${actual}`);
    }
}

/** Counts and UNIQUE values are not float arithmetic - a tolerance there would hide a real miss. */
function compareExact(check: PivotCheck, expected: any, actual: any, describe: () => string) {
    check.checked++;
    if (!isEqual(expected ?? null, actual ?? null) && check.errors.length < 5) {
        check.errors.push(`${describe()}: expected ${expected}, got ${actual}`);
    }
}

function compareKind(
    check: PivotCheck,
    kind: RefAggKind,
    expected: any,
    actual: any,
    describe: () => string
) {
    const fn = kind === 'CHILD_COUNT' || kind === 'UNIQUE' ? compareExact : compare;
    fn(check, expected, actual, describe);
}

interface FlatPath {
    path: PivotPath;
    refKey: string;
    /** Cell field name per value field, in `valueFields` order. */
    names: string[];
}

/** Pivot members of the result, absent on a plain View. */
function pivotResult(view: View): {paths: PivotPath[]; cellFields: PivotCellField[]} {
    const {paths, cellFields} = view.result as PivotViewResult;
    return {paths: paths ?? [], cellFields: cellFields ?? []};
}

/**
 * Every pivot path with its reference key and its published cell field names. Names are resolved via
 * the result's own `cellFields`, matched by path *identity* - no string keys, so nothing here can
 * disagree with what the view actually published.
 */
function flattenPaths(view: View, valueFields: string[]): FlatPath[] {
    const {paths, cellFields} = pivotResult(view),
        namesByPath = new Map<PivotPath, Map<string, string>>();

    cellFields.forEach(cf => {
        let byField = namesByPath.get(cf.path);
        if (!byField) namesByPath.set(cf.path, (byField = new Map()));
        byField.set(cf.valueField.name, cf.name);
    });

    const ret: FlatPath[] = [];
    const walk = (path: PivotPath, prefix: string) => {
        const refKey = encode(prefix, path.value, path.isEmpty),
            byField = namesByPath.get(path);
        ret.push({path, refKey, names: valueFields.map(f => byField?.get(f))});
        path.children.forEach(child => walk(child, refKey));
    };
    paths.forEach(root => walk(root, ''));
    return ret;
}

/**
 * Walk the visible row tree, comparing every group row's own measure (its row total) and every one of
 * its cells against the reference.
 */
export function checkPivotView(config: PivotCheckConfig): PivotCheck[] {
    const {view, groupBy, pivotBy, valueFields, aggregators = {}, label} = config,
        {includeRoot, includeLeaves, bucketSpecFn} = view.query,
        gDepth = groupBy.length,
        pDepth = pivotBy.length,
        pivoted = !isEmpty(pivotBy),
        kinds: RefAggKind[] = valueFields.map(f => aggregators[f] ?? 'SUM'),
        ref = accumulate(config),
        flatPaths = flattenPaths(view, valueFields),
        leavesById = new Map(config.leaves.map(l => [String(l.id), l]));

    const rowTotals = mkCheck(`${label}: row totals match the reference`),
        cells = mkCheck(`${label}: cell values match the reference`),
        childCounts = mkCheck(`${label}: CHILD_COUNT cells count child groups on their path`),
        invariant = mkCheck(`${label}: row total equals the sum of its top-level pivot cells`),
        leafValues = mkCheck(`${label}: exposed leaves carry their source record's measures`),
        leafCells = mkCheck(`${label}: exposed leaves carry their own path's cell value`),
        buckets = mkCheck(`${label}: bucket rows aggregate their own children`);

    const visit = (row: ViewRowData, depth: number, gKey: string) => {
        // Cube leaves aggregate nothing and the reference has no key for them. Check the two things
        // they should carry: their source record's values, and their own pivot column only.
        if (row.cubeRowType === 'leaf') {
            const src = leavesById.get(String(row.cubeLabel));
            valueFields.forEach(field => {
                compare(
                    leafValues,
                    src?.[field] ?? null,
                    row[field] ?? null,
                    () => `leaf ${row.id} ${field}`
                );
            });
            if (!pivoted) return;

            const ownKey = pivotBy.reduce((acc, d) => encode(acc, row[d]), '');
            flatPaths.forEach(({path, refKey, names: cellNames}) => {
                if (path.depth !== pDepth) return;
                const isOwn = refKey === ownKey;
                valueFields.forEach((field, v) => {
                    compare(
                        leafCells,
                        isOwn ? (row[field] ?? null) : null,
                        row[cellNames[v]] ?? null,
                        () => `leaf ${row.id} path "${path.key}" ${field}`
                    );
                });
            });
            return;
        }

        // Bucketing inserts a level that applies no group dimension. Assert the bucket partitions its
        // children, then continue the reference walk at the same depth and key.
        if (row.cubeRowType === 'bucket') {
            valueFields.forEach((field, v) => {
                if (kinds[v] !== 'SUM') return;
                let sum = null;
                row.children?.forEach(child => {
                    const val = child[field];
                    if (val != null) sum = (sum ?? 0) + val;
                });
                compare(
                    buckets,
                    sum,
                    row[field] ?? null,
                    () => `bucket "${row.cubeLabel}" ${field}`
                );
            });
            row.children?.forEach(child => visit(child, depth, gKey));
            return;
        }

        // The synthetic root sits at depth 0 and applies no dimension of its own.
        const myKey = depth === 0 ? gKey : encode(gKey, row[groupBy[depth - 1]]),
            node = ref.get(`${myKey}/`);

        valueFields.forEach((field, v) => {
            compareKind(
                rowTotals,
                kinds[v],
                expected(node, v, kinds[v], depth, 0, gDepth, pDepth),
                row[field] ?? null,
                () => `depth ${depth} "${row.cubeLabel}" ${field}`
            );
        });

        if (pivoted) {
            flatPaths.forEach(({path, refKey, names: cellNames}) => {
                const cellNode = ref.get(`${myKey}/${refKey}`);
                valueFields.forEach((field, v) => {
                    const kind = kinds[v];
                    compareKind(
                        kind === 'CHILD_COUNT' ? childCounts : cells,
                        kind,
                        expected(cellNode, v, kind, depth, path.depth, gDepth, pDepth),
                        row[cellNames[v]] ?? null,
                        () => `depth ${depth} "${row.cubeLabel}" path "${path.key}" ${field}`
                    );
                });
            });

            // The docked Total column must equal the sum of the visible pivot columns. Additive
            // aggregators only - a strict, average, unique or count total is not a sum of its cells.
            valueFields.forEach((field, v) => {
                if (kinds[v] !== 'SUM') return;
                let sum = null;
                flatPaths.forEach(({path, names: cellNames}) => {
                    if (path.depth !== 1) return;
                    const val = row[cellNames[v]];
                    if (val != null) sum = (sum ?? 0) + val;
                });
                compare(
                    invariant,
                    sum,
                    row[field] ?? null,
                    () => `depth ${depth} "${row.cubeLabel}" ${field} pivot sum vs total`
                );
            });
        }

        row.children?.forEach(child => visit(child, depth + 1, myKey));
    };

    view.result.rows.forEach(row => visit(row, includeRoot ? 0 : 1, ''));

    // Included only where the scenario can populate them, so a zero-count check is a real failure
    // rather than a vacuous pass.
    const ret = [rowTotals];
    if (pivoted) {
        if (kinds.some(k => k !== 'CHILD_COUNT')) ret.push(cells);
        if (kinds.includes('CHILD_COUNT')) ret.push(childCounts);
        if (kinds.includes('SUM')) ret.push(invariant);
        if (includeLeaves) ret.push(leafCells);
    }
    if (includeLeaves) ret.push(leafValues);
    if (bucketSpecFn) ret.push(buckets);

    ret.forEach(check => {
        if (!check.checked) check.errors.push('nothing was compared - check is vacuous');
    });

    return ret;
}

/**
 * Compare two views over identical Cube data cell-by-cell. Run against a view that reached its state
 * incrementally and one rebuilt from scratch, this is the check the tick path cannot cheat.
 */
export function comparePivotViews(
    incremental: View,
    rebuilt: View,
    valueFields: string[],
    label: string,
    pivoted = true
): PivotCheck {
    const ret = mkCheck(label),
        {cellFields} = pivotResult(rebuilt),
        byId = new Map<string, ViewRowData>();

    const index = (row: ViewRowData) => {
        byId.set(row.id, row);
        row.children?.forEach(index);
    };
    rebuilt.result.rows.forEach(index);

    const fieldNames = [...valueFields, ...cellFields.map(cf => cf.name)];

    const visit = (row: ViewRowData) => {
        const other = byId.get(row.id);
        if (!other) {
            if (ret.errors.length < 5)
                ret.errors.push(`row ${row.id} absent from the rebuilt view`);
            return;
        }
        fieldNames.forEach(name => {
            compare(ret, other[name] ?? null, row[name] ?? null, () => `row ${row.id} ${name}`);
        });
        row.children?.forEach(visit);
    };
    incremental.result.rows.forEach(visit);

    if (!ret.checked) ret.errors.push('no values were compared');
    if (pivoted && isEmpty(cellFields)) {
        ret.errors.push('rebuilt view published no cell fields');
    }
    return ret;
}

export interface CellStoreCheckConfig {
    view: View;
    /** Store declaring one Field per `result.cellFields` entry, loaded from the view. */
    store: Store;
    /** Aggregator per value field, so counts and UNIQUE values compare exactly. */
    aggregators?: Record<string, RefAggKind>;
    label: string;
}

/**
 * Every cell read back out of a connected `Store`, through fields declared from `result.cellFields`.
 *
 * This is the claim the whole `Cells on row data` decision rests on - cell values are ordinary Store
 * fields, so value columns work with column filters, Excel export and inline editing. The rest of the
 * suite proves cells are correct *on the view*; only this proves they survive into records.
 *
 * Returns two checks, each with its own comparison count so neither can pass vacuously: populated
 * cells must match the view, and cells the view left *absent* from row data must read the declared
 * field's `defaultValue` - null, not undefined - via `Store`'s sparse prototype or dense template.
 */
export function checkCellStore({
    view,
    store,
    aggregators = {},
    label
}: CellStoreCheckConfig): PivotCheck[] {
    const values = mkCheck(`${label}: cell values via Store`),
        nulls = mkCheck(`${label}: absent cells read null via Store`),
        {cellFields} = pivotResult(view);

    const visit = (row: ViewRowData) => {
        const rec = store.getById(row.id);
        if (!rec) {
            if (values.errors.length < 5) {
                values.errors.push(`row ${row.id} absent from the connected store`);
            }
        } else {
            cellFields.forEach(cf => {
                const {name} = cf,
                    kind = aggregators[cf.valueField.name] ?? 'SUM',
                    got = rec.data[name];

                // Own property iff the view projected a value here - cell names are not query
                // fields, so an unpopulated cell is absent rather than null on the row data.
                if (Object.prototype.hasOwnProperty.call(row, name)) {
                    compareKind(
                        values,
                        kind,
                        row[name] ?? null,
                        got ?? null,
                        () => `${row.id} ${name}`
                    );
                } else {
                    nulls.checked++;
                    if (got !== null && nulls.errors.length < 5) {
                        nulls.errors.push(
                            `${row.id} ${name}: unpopulated cell read ${got === undefined ? 'undefined - field not declared?' : got}, expected null`
                        );
                    }
                }
            });
        }
        row.children?.forEach(visit);
    };

    view.result.rows.forEach(visit);

    if (!values.checked) values.errors.push('nothing was compared - check is vacuous');
    if (!nulls.checked) {
        nulls.errors.push('no unpopulated cell was seen - scenario cannot prove the null default');
    }
    return [values, nulls];
}
