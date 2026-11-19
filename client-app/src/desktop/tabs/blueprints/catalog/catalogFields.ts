import type {Blueprint, DataCatalog, FieldDef} from '@xh/hoist-chat-kit/blueprint';
import type {PlainObject} from '@xh/hoist/core';
import {isArray, isEmpty, isPlainObject, isString, omit} from 'lodash';

/** One place a blueprint uses a field: a JSON Pointer, and the instance it goes through. */
export interface FieldUse {
    path: string;
    instance?: string;
    params?: PlainObject;
}

/** The fields a blueprint uses, by dataset, then by field name. */
export type FieldUsages = Record<string, Record<string, FieldUse[]>>;

/**
 * The options of a field's format, as the kit resolves them: the base kind's built-in default,
 * then the kind's format, then the field's own. Names resolve through the catalog's formats.
 */
export function resolveFieldFormat(field: FieldDef, catalog: DataCatalog): PlainObject {
    const kind = catalog.kinds[field.kind],
        base = kind?.base ?? field.kind,
        expand = (f: string | PlainObject): PlainObject => {
            if (f == null) return {};
            if (isString(f)) return catalog.formats[f] ?? {};
            return isString(f.name) ? {...expand(f.name), ...omit(f, 'name')} : f;
        },
        // The catalog copies the kind's format onto the field, so only a different one is its own.
        own = field.format !== kind?.format ? field.format : null;
    return {...builtInDefault(base), ...expand(kind?.format), ...expand(own)};
}

/** Format options as one line, such as `scale: millions, precision: 1, ledger`. */
export function describeFormat(opts: PlainObject): string {
    return Object.entries(opts ?? {})
        .map(([k, v]) => (v === true ? k : `${k}: ${isPlainObject(v) ? JSON.stringify(v) : v}`))
        .join(', ');
}

/** A catalog value that may be a name or an object with options, as one line. */
export function describeSpec(spec: string | PlainObject): string {
    if (spec == null) return '';
    if (isString(spec)) return spec;
    const {name, type, ...rest} = spec,
        head = name ?? type,
        opts = describeFormat(rest);
    return head ? (opts ? `${head} (${opts})` : head) : opts;
}

/**
 * Every field the blueprint uses, by dataset: in a widget's columns, grouping, filter, chart axes
 * or sort, in a source's field instances and filter, and in the variables that feed them. A widget
 * with no source, such as a grouping chooser, and a variable's values count for the datasets of
 * the widgets that read its variables.
 */
export function findFieldUsages(blueprint: Blueprint, catalog: DataCatalog): FieldUsages {
    const ret: FieldUsages = {};
    if (!blueprint) return ret;

    const sources = blueprint.sources ?? {},
        elements = blueprint.elements ?? {},
        variables = blueprint.variables ?? {},
        datasetOf = (source: unknown) =>
            isString(source) ? (sources[source]?.dataset ?? null) : null,
        allDatasets = uniqueOf(Object.values(sources).map(it => it.dataset)),
        varDatasets: Record<string, Set<string>> = {},
        addVar = (name: string, ds: string) => (varDatasets[name] ??= new Set()).add(ds);

    // Each variable a widget reads counts for its source's dataset.
    Object.values(elements).forEach(el => {
        const ds = datasetOf(el.config?.source);
        if (ds) varBindings(el.config).forEach(v => addVar(v, ds));
    });
    Object.values(sources).forEach(src => {
        if (src.dataset) varBindings(src.filter).forEach(v => addVar(v, src.dataset));
    });

    const mark = (datasets: string[], name: string, path: string) => {
        datasets.forEach(ds => {
            const fields = catalog.getDataset(ds)?.fields;
            // A name may be an instance a source declares over the dataset.
            const inst = Object.entries(sources)
                .filter(([, s]) => s.dataset === ds)
                .map(([, s]) => s.fields?.[name])
                .find(Boolean);
            const field = inst?.field ?? name;
            if (!fields?.[field]) return;
            const use: FieldUse = inst ? {path, instance: name} : {path};
            ((ret[ds] ??= {})[field] ??= []).push(use);
        });
    };
    const datasetsOfVars = (names: string[]) => {
        const found = uniqueOf(names.flatMap(n => [...(varDatasets[n] ?? [])]));
        return found.length ? found : allDatasets;
    };

    // Sources: their field instances, and their filters.
    Object.entries(sources).forEach(([id, src]) => {
        if (!src.dataset) return;
        Object.entries(src.fields ?? {}).forEach(([inst, def]) => {
            if (!catalog.getDataset(src.dataset)?.fields[def.field]) return;
            const use: FieldUse = {path: `/sources/${id}/fields/${inst}`, instance: inst};
            if (!isEmpty(def.params)) use.params = def.params;
            ((ret[src.dataset] ??= {})[def.field] ??= []).push(use);
        });
        fieldRefs(src.filter, `/sources/${id}/filter`).forEach(r =>
            mark([src.dataset], r.name, r.path)
        );
    });

    // Widgets: on their source's dataset, or through the variables they write.
    Object.entries(elements).forEach(([id, el]) => {
        const ds = datasetOf(el.config?.source),
            refs = fieldRefs(omit(el.config, 'source'), `/elements/${id}/config`);
        if (!refs.length) return;
        const datasets = ds ? [ds] : datasetsOfVars(writtenVars(id, el.config, variables));
        refs.forEach(r => mark(datasets, r.name, r.path));
    });

    // Variables: their values, and the field a widget writes them from.
    Object.entries(variables).forEach(([name, decl]) => {
        const datasets = datasetsOfVars([name]),
            path = `/variables/${name}`,
            value = (decl.default as PlainObject)?.value;
        if (isString(value)) mark(datasets, value, `${path}/default/value`);
        if (isArray(value)) {
            value.forEach((v, i) => {
                if (isString(v)) mark(datasets, v, `${path}/default/value/${i}`);
            });
        }
        fieldRefs(value, `${path}/default/value`).forEach(r => mark(datasets, r.name, r.path));

        const options = decl.options as PlainObject;
        if (options?.dataset && options.field) {
            mark([options.dataset], options.field, `${path}/options/field`);
        }
        const writers = [decl.setBy].flat().filter(isPlainObject) as PlainObject[];
        writers.forEach((w, i) => {
            if (!isString(w.field)) return;
            const ds = datasetOf(elements[w.element]?.config?.source),
                at = isArray(decl.setBy) ? `${path}/setBy/${i}/field` : `${path}/setBy/field`;
            mark(ds ? [ds] : datasets, w.field, at);
        });
    });
    return ret;
}

//------------------
// Implementation
//------------------
/** Keys whose string value names a field, and keys whose array holds field names. */
const FIELD_KEYS = ['field', 'x', 'sortBy', 'colId'],
    FIELD_LIST_KEYS = ['y', 'columnState', 'groupBy', 'dimensions', 'fields'];

function fieldRefs(o: unknown, path: string): {name: string; path: string}[] {
    const ret: {name: string; path: string}[] = [],
        walk = (v: unknown, p: string) => {
            if (isArray(v)) return v.forEach((it, i) => walk(it, `${p}/${i}`));
            if (!isPlainObject(v)) return;
            Object.entries(v as PlainObject).forEach(([k, val]) => {
                const at = `${p}/${k}`;
                if (FIELD_KEYS.includes(k) && isString(val)) {
                    ret.push({name: val.split('|')[0], path: at});
                } else if (FIELD_LIST_KEYS.includes(k) && isArray(val)) {
                    val.forEach((it, i) =>
                        isString(it)
                            ? ret.push({name: it, path: `${at}/${i}`})
                            : walk(it, `${at}/${i}`)
                    );
                } else {
                    walk(val, at);
                }
            });
        };
    walk(o, path);
    return ret;
}

function varBindings(o: unknown): string[] {
    const ret: string[] = [],
        walk = (v: unknown) => {
            if (isArray(v)) return v.forEach(walk);
            if (!isPlainObject(v)) return;
            if (isString((v as PlainObject).$var)) ret.push((v as PlainObject).$var);
            Object.values(v as PlainObject).forEach(walk);
        };
    walk(o);
    return ret;
}

/** The variables a widget sets: as its declared writer, or through its actions. */
function writtenVars(id: string, config: PlainObject, variables: Blueprint['variables']): string[] {
    const byDecl = Object.entries(variables ?? {})
            .filter(([, d]) =>
                [d.setBy].flat().some(w => isPlainObject(w) && (w as PlainObject).element === id)
            )
            .map(([name]) => name),
        byAction: string[] = [],
        walk = (v: unknown) => {
            if (isArray(v)) return v.forEach(walk);
            if (!isPlainObject(v)) return;
            const {variable} = v as PlainObject;
            if (isString(variable)) byAction.push(variable);
            Object.values(v as PlainObject).forEach(walk);
        };
    walk(config);
    return uniqueOf([...byDecl, ...byAction]);
}

function builtInDefault(base: string): PlainObject {
    if (base === 'shares') return {precision: 0};
    if (base?.startsWith('currency:')) return {precision: 2};
    return {};
}

function uniqueOf(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))];
}
