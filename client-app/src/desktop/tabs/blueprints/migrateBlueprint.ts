import type {PlainObject} from '@xh/hoist/core';
import {isPlainObject, isString, mapValues, omit, pick} from 'lodash';

const MOVED = ['format', 'renderer'];

/**
 * Bring a blueprint stored in an older shape up to date: a `columnState` entry's `format` and
 * `renderer` move to the widget's `columns`, keyed by field, where an existing entry wins.
 * Returns the blueprint itself when nothing needs to change.
 */
export function migrateBlueprint<T extends PlainObject>(bp: T): T {
    if (!bp?.elements) return bp;
    let changed = false;
    const elements = mapValues(bp.elements, (el: PlainObject) => {
        const config = el?.config,
            state = config?.columnState;
        if (!Array.isArray(state) || !state.some(isStale)) return el;

        changed = true;
        const columns = {...config.columns};
        const columnState = state.map(it => {
            if (!isStale(it)) return it;
            columns[it.field] = {...pick(it, MOVED), ...columns[it.field]};
            const rest = omit(it, MOVED);
            return Object.keys(rest).length > 1 ? rest : it.field;
        });
        return {...el, config: {...config, columnState, columns}};
    });
    return changed ? {...bp, elements} : bp;
}

function isStale(entry: unknown): entry is PlainObject {
    return (
        isPlainObject(entry) &&
        isString((entry as PlainObject).field) &&
        MOVED.some(k => k in (entry as PlainObject))
    );
}
