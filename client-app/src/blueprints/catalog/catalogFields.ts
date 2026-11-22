import type {Blueprint, DataCatalog, DatasetDef} from '@xh/hoist-chat-kit/blueprint';
import type {PlainObject} from '@xh/hoist/core';
import {isPlainObject, isString} from 'lodash';

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

export interface DatasetJoin {
    dataset: string;
    on: string[];
}

/**
 * The datasets that can join onto a dataset: those with key fields it has as dimensions, with the
 * fields they would join on. In catalog order.
 */
export function datasetJoins(catalog: DataCatalog, ds: DatasetDef): DatasetJoin[] {
    if (!ds.key?.length) return [];
    return Object.values(catalog.datasets).flatMap(other => {
        if (other === ds) return [];
        const on = (other.key ?? []).filter(
            f => ds.fields[f]?.isDimension && other.fields[f]?.isDimension
        );
        return on.length ? [{dataset: other.name, on}] : [];
    });
}

export interface DatasetMatch {
    name: string;
    /** The fields whose name or label holds the query, in catalog order. */
    fieldHits: string[];
}

/**
 * The datasets a query finds: by name, label or description, or by any field's name or label,
 * ignoring case. Every dataset, with no field hits, for an empty query. In catalog order.
 */
export function matchDatasets(datasets: DatasetDef[], query: string): DatasetMatch[] {
    const q = query?.trim().toLowerCase();
    if (!q) return datasets.map(it => ({name: it.name, fieldHits: []}));
    const has = (...vals: string[]) => vals.some(v => v?.toLowerCase().includes(q));
    return datasets.flatMap(ds => {
        const fieldHits = Object.values(ds.fields)
            .filter(f => has(f.name, f.label))
            .map(f => f.name);
        return has(ds.name, ds.label, ds.description) || fieldHits.length
            ? [{name: ds.name, fieldHits}]
            : [];
    });
}

/** The sources of a blueprint over a dataset, and the elements that read those sources. */
export function datasetUsers(
    blueprint: Blueprint,
    dataset: string
): {sources: string[]; elements: string[]} {
    const sources = Object.entries(blueprint?.sources ?? {})
            .filter(([, decl]) => decl.dataset === dataset)
            .map(([id]) => id),
        elements = Object.entries(blueprint?.elements ?? {})
            .filter(([, el]) => sources.includes(el.config?.source))
            .map(([id]) => id);
    return {sources, elements};
}
