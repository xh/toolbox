import {PlainObject} from '@xh/hoist/core';
import {CubeFieldSpec, FieldSpec} from '@xh/hoist/data';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {times} from 'lodash';

/**
 * Synthetic "wide fact table" dataset for the Store proxy-mode benchmark - a flat set of records
 * with a field count typical of a risk/PnL blotter, where per-record object overhead (not string
 * content) dominates memory.
 *
 * 160 fields total: 40 strings (the first 6 of which are Cube dimensions), 114 numbers, 2 dates,
 * 2 LocalDates, 2 bools. String values are drawn from shared pools, so they cost one reference per
 * record rather than fresh character data - realistic for categorical data, and it keeps the
 * measurement focused on the per-record structures the proxy is designed to avoid duplicating.
 */

export const DIM_COUNT = 6,
    STRING_COUNT = 40,
    NUMBER_COUNT = 114,
    DATE_COUNT = 2,
    LOCALDATE_COUNT = 2,
    BOOL_COUNT = 2,
    FIELD_COUNT = STRING_COUNT + NUMBER_COUNT + DATE_COUNT + LOCALDATE_COUNT + BOOL_COUNT;

export const DIM_NAMES = times(DIM_COUNT, i => `str${i}`);

/**
 * The 35 fields the View use-case queries for - a realistic narrow slice of the full 160, mixing
 * the low-cardinality dimension strings with a block of measures.
 */
export const VIEW_FIELDS = [
    ...times(10, i => `str${i}`),
    ...times(23, i => `num${i}`),
    'date0',
    'bool0'
];

/** Cardinality of each dimension's value pool - modest, to keep aggregation tractable. */
const DIM_CARDINALITY = [8, 12, 20, 6, 15, 10];

/** Shared pool size for the non-dimension strings. */
const STRING_POOL_SIZE = 500;

/** Cube field specs - dimensions on the leading strings, aggregators on everything else. */
export function cubeFieldSpecs(): CubeFieldSpec[] {
    const specs: CubeFieldSpec[] = [];
    times(STRING_COUNT, i =>
        specs.push({
            name: `str${i}`,
            type: 'string',
            ...(i < DIM_COUNT ? {isDimension: true} : {aggregator: 'UNIQUE'})
        })
    );
    times(NUMBER_COUNT, i => specs.push({name: `num${i}`, type: 'number', aggregator: 'SUM'}));
    times(DATE_COUNT, i => specs.push({name: `date${i}`, type: 'date', aggregator: 'MAX'}));
    times(LOCALDATE_COUNT, i => specs.push({name: `ld${i}`, type: 'localDate', aggregator: 'MAX'}));
    times(BOOL_COUNT, i => specs.push({name: `bool${i}`, type: 'bool', aggregator: 'UNIQUE'}));
    return specs;
}

/** Plain Store field specs for all 160 fields - the copy-into-Store use-case. */
export function allStoreFieldSpecs(): FieldSpec[] {
    return cubeFieldSpecs().map(({name, type}) => ({name, type}));
}

/**
 * Store field specs for a Cube View's connected store - the queried subset, plus the `cubeLabel`
 * and `cubeDimension` properties every ViewRowData carries.
 */
export function viewStoreFieldSpecs(): FieldSpec[] {
    const byName = new Map(cubeFieldSpecs().map(f => [f.name, f]));
    return [
        ...VIEW_FIELDS.map(name => ({name, type: byName.get(name).type})),
        {name: 'cubeLabel', type: 'string' as const},
        {name: 'cubeDimension', type: 'string' as const}
    ];
}

/** Seeded PRNG (mulberry32), so every run generates an identical dataset. */
function makeRandom(seed: number) {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Generate `count` raw fact objects, each carrying all 160 fields plus an `id`. */
export function generateRawRecords(count: number): PlainObject[] {
    const rnd = makeRandom(0x5eed),
        dimPools = DIM_CARDINALITY.map((size, d) => times(size, i => `dim${d}-val${i}`)),
        strPool = times(STRING_POOL_SIZE, i => `str-val-${i}`),
        datePool = times(64, i => new Date(2026, 0, 1 + i)),
        ldPool = times(64, i => LocalDate.get('20260101').add(i, 'days')),
        ret = new Array(count);

    for (let r = 0; r < count; r++) {
        const rec: PlainObject = {id: r};

        for (let i = 0; i < STRING_COUNT; i++) {
            rec[`str${i}`] =
                i < DIM_COUNT
                    ? dimPools[i][(rnd() * dimPools[i].length) | 0]
                    : strPool[(rnd() * STRING_POOL_SIZE) | 0];
        }
        for (let i = 0; i < NUMBER_COUNT; i++) {
            rec[`num${i}`] = rnd() * 100000;
        }
        for (let i = 0; i < DATE_COUNT; i++) {
            rec[`date${i}`] = datePool[(rnd() * datePool.length) | 0];
        }
        for (let i = 0; i < LOCALDATE_COUNT; i++) {
            rec[`ld${i}`] = ldPool[(rnd() * ldPool.length) | 0];
        }
        for (let i = 0; i < BOOL_COUNT; i++) {
            rec[`bool${i}`] = rnd() > 0.5;
        }

        ret[r] = rec;
    }

    return ret;
}
