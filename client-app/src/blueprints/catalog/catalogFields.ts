import type {
    Blueprint,
    DataCatalog,
    DatasetDef,
    FieldDef,
    FieldUsages
} from '@xh/hoist-chat-kit/blueprint';
import type {PlainObject} from '@xh/hoist/core';
import {castArray, groupBy, isPlainObject, isString, sortBy} from 'lodash';

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

/** An entry of the Data Catalog's list: a dataset, a kind or a format. */
export interface CatalogEntry {
    id: string;
    section: 'Datasets' | 'Kinds' | 'Formats';
    kind: 'dataset' | 'kind' | 'format';
    name: string;
    /** A short line beside the name: fields the query hit, fields used, a base or options. */
    meta: string;
}

/**
 * The catalog's datasets, and the kinds and formats their fields use, that a query finds, in
 * catalog order: a dataset by name, label, description or field; a kind by name or base; a format
 * by name or options.
 */
export function catalogEntries(
    catalog: DataCatalog,
    query: string,
    usages: FieldUsages
): CatalogEntry[] {
    const q = query?.trim().toLowerCase(),
        has = (...vals: string[]) => !q || vals.some(v => v?.toLowerCase().includes(q)),
        datasets = matchDatasets(Object.values(catalog.datasets), query).map(
            ({name, fieldHits}): CatalogEntry => {
                const used = Object.keys(usages[name] ?? {}).length,
                    hits = fieldHits.length
                        ? `${fieldHits.slice(0, 2).join(', ')}${fieldHits.length > 2 ? ` +${fieldHits.length - 2}` : ''} in ${name}`
                        : null;
                return {
                    id: `dataset:${name}`,
                    section: 'Datasets',
                    kind: 'dataset',
                    name,
                    meta: hits ?? (used ? `${used} used` : null)
                };
            }
        ),
        fields = Object.values(catalog.datasets).flatMap(ds => Object.values(ds.fields)),
        usedKinds = new Set(fields.map(f => f.kind).filter(k => k && catalog.kinds[k])),
        usedFormats = new Set([
            ...[...usedKinds].map(k => catalog.kinds[k].format),
            ...fields.map(f => f.format)
        ]),
        kinds = Object.entries(catalog.kinds)
            .filter(([name, k]) => usedKinds.has(name) && has(name, k.base))
            .map(([name, k]): CatalogEntry => ({
                id: `kind:${name}`,
                section: 'Kinds',
                kind: 'kind',
                name,
                meta: k.base ?? null
            })),
        formats = Object.entries(catalog.formats)
            .filter(([name]) => usedFormats.has(name))
            .map(([name, opts]) => [name, describeFormat(opts)])
            .filter(([name, desc]) => has(name, desc))
            .map(([name, desc]): CatalogEntry => ({
                id: `format:${name}`,
                section: 'Formats',
                kind: 'format',
                name,
                meta: desc || null
            }));
    return [...datasets, ...kinds, ...formats];
}

/** A dataset's fields under one heading, as the Data Catalog lists them. */
export interface FieldGroup {
    title: string;
    fields: FieldDef[];
}

/**
 * A dataset's fields grouped by the catalog's field groups, in first-seen order with nested groups
 * joined, or by kind: kinds in name order, a kind no catalog kind defines marked as a base, fields
 * with none last.
 */
export function fieldGroups(
    ds: DatasetDef,
    catalog: DataCatalog,
    by: 'group' | 'kind'
): FieldGroup[] {
    const fields = Object.values(ds.fields);
    if (by === 'group') {
        const byGroup = groupBy(fields, f => castArray(f.category ?? 'Other').join(' › '));
        return Object.entries(byGroup).map(([title, fields]) => ({title, fields}));
    }
    const byKind = groupBy(fields, f => f.kind ?? ''),
        kinds = sortBy(Object.keys(byKind), it => (it ? `0${it}` : '1'));
    return kinds.map(kind => ({
        title: !kind ? 'No kind' : catalog.kinds[kind] ? kind : `${kind} (base)`,
        fields: byKind[kind]
    }));
}

/** The properties a field sets, beyond its name, label, type and role, each as one line. */
export function fieldProps(f: FieldDef): [string, string][] {
    const rows: [string, string][] = [
        ['kind', f.kind],
        ['format', describeSpec(f.format)],
        ['aggregator', f.isDimension ? null : describeSpec(f.aggregator)],
        ['under', f.parentDimension],
        ['renderer', describeSpec(f.renderer)],
        [
            'params',
            f.params
                ? Object.entries(f.params)
                      .map(([n, p]) => `${n}: ${p.type}${p.required ? '' : '?'}`)
                      .join(', ')
                : null
        ],
        ['use', f.replacedBy ?? (f.deprecated ? 'deprecated' : null)]
    ];
    return rows.filter(([, v]) => v);
}

/** A positive, a negative and a large number, scaled so a format shows each with digits. */
export function sampleValues(format: PlainObject): number[] {
    switch (format?.scale) {
        case 'billions':
            return [12345678901.2, -9876543210.9, 123456789012];
        case 'millions':
            return [12345678.9, -9876543.2, 123456789];
        case 'thousands':
            return [12345.6, -9876.5, 1234567];
        default:
            return [1234.56, -987.65, 1234567.89];
    }
}
