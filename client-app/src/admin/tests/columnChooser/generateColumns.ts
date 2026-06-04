import {ColumnOrGroupSpec, ColumnSpec} from '@xh/hoist/cmp/grid';
import {PlainObject} from '@xh/hoist/core';
import {numberRenderer} from '@xh/hoist/format';
import {cloneDeep} from 'lodash';

export type GridSize = 'small' | 'medium' | 'large';

/** Custom column added interactively via the Add Column form. */
export interface CustomColumn {
    spec: ColumnSpec;
    /** Target group id, or '' for top-level. New ids create a new top-level group. */
    group: string;
}

const TYPES = ['string', 'number', 'bool'] as const;
const ROW_COUNT = 50;

type LeafType = (typeof TYPES)[number];

/** Collected leaf field, used to generate matching record data. */
interface LeafField {
    name: string;
    type: LeafType;
}

/**
 * Generate a deliberately-simple set of columns + matching records to stress the ColumnChooser
 * across small/medium/large counts with multiple levels of group nesting. Generated columns carry
 * no chooser constraints - those are exercised via the Add Column form.
 *
 * Each leaf `colId` encodes its group path so columns are easy to trace in the flat `columnState`,
 * e.g. `g0_c3` (group 0, column 3) or `g0_g3_c7` (group 0 › subgroup 3 › column 7). Ungrouped
 * top-level leaves are simply `c0`, `c1`, ...
 */
export function generateGridData(size: GridSize): {
    columns: ColumnOrGroupSpec[];
    records: PlainObject[];
} {
    const fields: LeafField[] = [],
        collect = (name: string, type: LeafType) => fields.push({name, type});

    let columns: ColumnOrGroupSpec[];
    switch (size) {
        case 'small':
            // Couple ungrouped leaves + one shallow group.
            columns = [...topLeaves(2, collect), ...buildGroups(leafTypes(4), [4], '', collect)];
            break;
        case 'medium':
            // Several top-level groups, each with one subgroup level.
            columns = buildGroups(leafTypes(30), [12, 6], '', collect);
            break;
        case 'large':
            // Three levels of nesting + a couple ungrouped top-level leaves.
            columns = [
                ...buildGroups(leafTypes(148), [50, 25, 10], '', collect),
                ...topLeaves(2, collect)
            ];
            break;
    }

    return {columns, records: generateRecords(fields)};
}

/** Merge interactively-added columns into a generated column tree (returns a fresh tree). */
export function mergeCustomColumns(
    columns: ColumnOrGroupSpec[],
    customs: CustomColumn[]
): ColumnOrGroupSpec[] {
    const result = cloneDeep(columns);
    customs.forEach(({spec, group}) => {
        if (!group) {
            result.push(spec);
        } else if (!appendToGroup(result, group, spec)) {
            result.push({
                groupId: group,
                headerName: group,
                headerAlign: 'center',
                children: [spec]
            });
        }
    });
    return result;
}

/** Collect all group ids in a column tree, for the Add Column group selector. */
export function collectGroupIds(columns: ColumnOrGroupSpec[]): string[] {
    const ids: string[] = [];
    const visit = (nodes: ColumnOrGroupSpec[]) =>
        nodes.forEach(node => {
            if (isGroup(node)) {
                ids.push(node.groupId);
                visit(node.children);
            }
        });
    visit(columns);
    return ids;
}

//------------------------
// Implementation
//------------------------
/** Sequence of leaf types of the given length, cycling string/number/bool for variety. */
function leafTypes(n: number): LeafType[] {
    return Array.from({length: n}, (_, k) => TYPES[k % 3]);
}

function topLeaves(n: number, collect: (name: string, type: LeafType) => void): ColumnSpec[] {
    return leafTypes(n).map((type, k) => makeLeaf(type, `c${k}`, `Col ${k}`, collect));
}

function makeLeaf(
    type: LeafType,
    id: string,
    displayName: string,
    collect: (name: string, type: LeafType) => void
): ColumnSpec {
    collect(id, type);
    // displayName defaults both headerName and chooserName; colId still encodes the group path.
    const spec: ColumnSpec = {colId: id, field: {name: id, type}, displayName, width: 120};
    if (type === 'number') {
        spec.align = 'right';
        spec.renderer = numberRenderer({precision: 0});
    }
    return spec;
}

/**
 * Recursively chunk leaves into nested groups - one group level per entry in `sizes`. Leaf colIds
 * encode the group path (e.g. `g0_g3_c7`); `path` is the dotted index path of the current group.
 */
function buildGroups(
    types: LeafType[],
    sizes: number[],
    path: string,
    collect: (name: string, type: LeafType) => void
): ColumnOrGroupSpec[] {
    if (!sizes.length) {
        const prefix = path
            .split('.')
            .map(s => `g${s}`)
            .join('_');
        return types.map((type, k) => makeLeaf(type, `${prefix}_c${k}`, `Col ${k}`, collect));
    }
    const [size, ...rest] = sizes;
    return chunk(types, size).map((kids, i) => {
        const id = path ? `${path}.${i}` : `${i}`;
        return {
            groupId: `grp-${id}`,
            headerName: `Group ${id}`,
            headerAlign: 'center',
            children: buildGroups(kids, rest, id, collect)
        };
    });
}

function generateRecords(fields: LeafField[]): PlainObject[] {
    return Array.from({length: ROW_COUNT}, (_, r) => {
        const rec: PlainObject = {id: r};
        fields.forEach(({name, type}, c) => {
            rec[name] =
                type === 'string'
                    ? `R${r}·C${c}`
                    : type === 'number'
                      ? (r * 31 + c * 7) % 1000
                      : (r + c) % 2 === 0;
        });
        return rec;
    });
}

function appendToGroup(nodes: ColumnOrGroupSpec[], groupId: string, spec: ColumnSpec): boolean {
    for (const node of nodes) {
        if (isGroup(node)) {
            if (node.groupId === groupId) {
                node.children.push(spec);
                return true;
            }
            if (appendToGroup(node.children, groupId, spec)) return true;
        }
    }
    return false;
}

function isGroup(
    node: ColumnOrGroupSpec
): node is ColumnOrGroupSpec & {groupId: string; children: ColumnOrGroupSpec[]} {
    return 'children' in node;
}

function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}
