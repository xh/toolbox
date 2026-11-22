import type {
    Blueprint,
    BlueprintSelection,
    DataCatalog,
    DatasetDef,
    FieldDef,
    FieldDisplayLayer,
    FieldUse,
    FieldUsages
} from '@xh/hoist-chat-kit/blueprint';
import {
    fieldUsages,
    formatValue,
    resolveFieldDisplay,
    resolveFormat
} from '@xh/hoist-chat-kit/blueprint';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, lookup, managed, XH} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, computed, observableRef} from '@xh/hoist/mobx';
import {castArray, groupBy, isEmpty, isString} from 'lodash';
import type {ReactNode} from 'react';
import {BlueprintShellModel} from '../BlueprintShellModel';
import type {ShownJson} from '../jsonDialog';
import {markdownCol} from '../markdown';
import {
    catalogEntries,
    datasetJoins,
    datasetUsers,
    describeFormat,
    describeSpec,
    fieldsByKind,
    sampleValues
} from './catalogFields';
import type {CatalogEntry, DatasetJoin} from './catalogFields';
import {catalogEntryName} from './CatalogViews';

/**
 * The Data Catalog the server serves, as the Blueprints tab loaded it: one list of its datasets,
 * kinds and formats beside the detail of the one selected, with marks on what the current
 * blueprint uses.
 */
export class CatalogModel extends HoistModel {
    @lookup(BlueprintShellModel) panelModel: BlueprintShellModel;

    /** One per dataset, in catalog order. */
    @managed datasetModels: DatasetCardModel[] = [];

    /** Filters datasets, kinds and formats, and datasets by their fields. */
    @bindable accessor query = '';

    /** The list entry the detail shows, as `<kind>:<name>`. */
    @bindable accessor selectedId: string = null;

    /** How a dataset's fields group: by the catalog's field groups, or by kind. */
    @bindable accessor fieldsGrouping: 'group' | 'kind' = 'group';

    /** The JSON the dialog shows, or null. */
    @observableRef accessor shownJson: ShownJson = null;

    @managed listModel = new GridModel({
        store: {idSpec: 'id'},
        groupBy: 'section',
        groupSortFn: (a, b) => SECTIONS.indexOf(a) - SECTIONS.indexOf(b),
        hideHeaders: true,
        emptyText: 'Nothing matches.',
        columns: [
            {field: 'section', hidden: true},
            {field: 'kind', hidden: true},
            {
                field: 'name',
                flex: 1,
                rendererIsComplex: true,
                renderer: (v, {record}) => catalogEntryName(v, record.data.meta)
            },
            {field: 'meta', hidden: true}
        ]
    });

    get blueprint(): Blueprint {
        return this.panelModel.blueprintModel.blueprint;
    }

    get catalog(): DataCatalog {
        return this.panelModel.blueprintModel.catalog;
    }

    @computed
    get usages(): FieldUsages {
        return fieldUsages(this.panelModel.blueprintModel.blueprint, this.catalog);
    }

    /** The selected entry's kind and name. */
    get selection(): {kind: CatalogEntry['kind']; name: string} {
        const id = this.selectedId,
            at = id?.indexOf(':') ?? -1;
        return at > 0
            ? {kind: id.slice(0, at) as CatalogEntry['kind'], name: id.slice(at + 1)}
            : null;
    }

    /** The selected dataset's model, if a dataset is selected. */
    get selectedDataset(): DatasetCardModel {
        const sel = this.selection;
        return sel?.kind === 'dataset'
            ? (this.datasetModels.find(it => it.ds.name === sel.name) ?? null)
            : null;
    }

    /** The open blueprint's sources over the selected dataset, and the elements reading them. */
    @computed
    get users(): {sources: string[]; elements: string[]} {
        return datasetUsers(this.blueprint, this.selectedDataset?.ds.name);
    }

    /** The fields that carry a kind, as `dataset.field`, by dataset. */
    fieldsOfKind(kind: string): {dataset: string; fields: string[]}[] {
        return Object.values(this.catalog.datasets)
            .map(ds => ({
                dataset: ds.name,
                fields: Object.values(ds.fields)
                    .filter(f => f.kind === kind)
                    .map(f => f.name)
            }))
            .filter(it => it.fields.length);
    }

    /** The kinds that format their values with a format. */
    kindsOfFormat(format: string): string[] {
        return Object.entries(this.catalog.kinds)
            .filter(([, k]) => k.format === format)
            .map(([name]) => name);
    }

    /** A format's options, as one line. */
    formatOptions(format: string): string {
        return describeFormat(this.catalog.formats[format]);
    }

    /** A positive, a negative and a large number, each as a format shows it. */
    formatSamples(format: string): {value: number; text: ReactNode}[] {
        const {catalog} = this,
            field: FieldDef = {name: 'sample', type: 'number', format} as FieldDef,
            opts = resolveFormat(field, [], {catalog, blueprint: null});
        return sampleValues(opts).map(value => ({
            value,
            text: formatValue(value, field, opts, catalog)
        }));
    }

    /** A kind's resolved format options, as one line. */
    kindFormat(kind: string): string {
        const k = this.catalog.kinds[kind];
        return (
            [
                describeSpec(k?.format),
                describeFormat(formatOf({name: kind, type: 'number', kind}, this.catalog))
            ]
                .filter(Boolean)
                .join(': ') || null
        );
    }

    /** Show the selected entry's JSON, as the catalog serves it. */
    @action
    showEntryJson() {
        const sel = this.selection;
        if (!sel) return;
        const {json} = this.catalog,
            section = {dataset: 'datasets', kind: 'kinds', format: 'formats'}[sel.kind];
        this.shownJson = {
            title: `${sel.name} (${sel.kind})`,
            json: JSON.stringify(json[section]?.[sel.name], null, 2)
        };
    }

    /** Show the whole catalog's JSON. */
    @action
    showCatalogJson() {
        this.shownJson = {title: 'Data Catalog', json: JSON.stringify(this.catalog.json, null, 2)};
    }

    @action
    closeJson() {
        this.shownJson = null;
    }

    /** Add a source over the selected dataset to the draft open, and show it there, selected. */
    addAsSource() {
        const {panelModel} = this,
            name = this.selectedDataset?.ds.name,
            {blueprintModel, designModel} = panelModel;
        if (!name) return;
        if (blueprintModel.mode !== 'design') blueprintModel.setMode('design');
        const {issues} = designModel.addSource(name, {addVariables: true}),
            error = issues.find(it => it.severity === 'error');
        if (error) {
            XH.dangerToast(error.message);
        } else {
            panelModel.showEditor();
        }
    }

    /** Select a source or element of the draft open, in the editor. */
    reveal(selection: BlueprintSelection) {
        this.panelModel.designModel.select(selection);
        this.panelModel.showEditor();
    }

    /** Select a list entry, as from a join chip. */
    select(id: string) {
        this.listModel.selModel.select(id);
    }

    override onLinked() {
        const {catalog} = this;
        this.datasetModels = Object.values(catalog.datasets).map(
            ds => new DatasetCardModel(ds, datasetJoins(catalog, ds), this)
        );
        this.addReaction(
            {
                track: () => [this.usages, this.fieldsGrouping],
                run: () => this.datasetModels.forEach(it => this.loadDataset(it, this.usages)),
                fireImmediately: true
            },
            {
                track: () => [this.query, this.usages],
                run: () => this.loadList(),
                fireImmediately: true
            },
            {
                track: () => this.listModel.selectedRecord,
                run: rec => {
                    if (rec) this.selectedId = rec.id as string;
                },
                fireImmediately: true
            }
        );
    }

    //------------------
    // Implementation
    //------------------
    private loadList() {
        const {listModel} = this,
            rows = catalogEntries(this.catalog, this.query, this.usages);
        listModel.loadData(rows);
        // Group rows keep their render while their key holds, so counts would go stale.
        listModel.agApi?.redrawRows();
        const keep = rows.some(it => it.id === this.selectedId);
        listModel.selModel.select(keep ? this.selectedId : (rows[0]?.id ?? null));
    }

    private loadDataset(model: DatasetCardModel, usages: FieldUsages) {
        const {ds} = model,
            uses = usages[ds.name] ?? {},
            tree = fieldTree(ds, this.catalog, uses, this.blueprint, (src, name) =>
                this.panelModel.blueprintModel.getSource(src)?.fieldLabel(name)
            );
        model.usedCount = Object.keys(uses).length;
        model.fieldsGridModel.loadData(
            this.fieldsGrouping === 'kind' ? fieldsByKind(tree, this.catalog) : tree
        );
    }
}

const SECTIONS = ['Datasets', 'Kinds', 'Formats'];

/** One dataset's detail: its fields grid, parameters and joins. */
export class DatasetCardModel extends HoistModel {
    @bindable accessor usedCount = 0;

    @managed fieldsGridModel = new GridModel({
        treeMode: true,
        expandLevel: -1,
        store: {idSpec: 'id', filterIncludesChildren: true},
        emptyText: 'No fields',
        columns: [
            {field: 'name', isTreeColumn: true, width: 200},
            usedCol(),
            {field: 'label', width: 140},
            {field: 'type', width: 80},
            {field: 'kind', width: 110},
            {field: 'align', width: 70},
            {field: 'width', width: 60, align: 'right'},
            {field: 'format', width: 200, tooltip: true},
            {field: 'aggregator', width: 120, tooltip: true},
            {field: 'role', width: 85},
            {field: 'parentDimension', headerName: 'Parent', width: 90},
            {field: 'params', width: 180, tooltip: true},
            {field: 'renderer', width: 130, tooltip: true},
            {field: 'deprecated', width: 110},
            markdownCol({field: 'guidance', flex: 1, minWidth: 260})
        ]
    });

    get fieldCount(): number {
        return Object.keys(this.ds.fields).length;
    }

    get description(): string {
        return [this.ds.description, this.ds.guidance].filter(Boolean).join(' ') || null;
    }

    get params(): ParamInfo[] {
        return paramRows(this.ds.params);
    }

    constructor(
        readonly ds: DatasetDef,
        /** The datasets that can join onto this one, with the fields they join on. */
        readonly joins: DatasetJoin[],
        readonly catalogModel: CatalogModel
    ) {
        super();
    }
}

export interface ParamInfo {
    name: string;
    type: string;
    required: boolean;
    kind: string;
    options: string;
    description: string;
}

//------------------
// Rows
//------------------
function usedCol() {
    return {
        field: 'usedAt',
        headerName: Icon.check(),
        headerTooltip: 'Used by this blueprint',
        width: 36,
        align: 'center' as const,
        renderer: (v: string) => (v ? Icon.check({className: 'xh-intent-success'}) : null),
        tooltip: (v: string) => v
    };
}

function paramRows(params: DatasetDef['params']): ParamInfo[] {
    return Object.entries(params ?? {}).map(([name, p]) => ({
        name,
        type: p.type,
        required: !!p.required,
        kind: p.kind,
        options: isEmpty(p.options) ? null : JSON.stringify(p.options),
        description: p.description
    }));
}

/**
 * Fields under their category path. Under each field, the instances the blueprint declares and the
 * sources that override how it shows.
 *
 * @param fieldLabel - a source's label for one of its fields, for an instance that sets none.
 */
export function fieldTree(
    ds: DatasetDef,
    catalog: DataCatalog,
    uses: Record<string, FieldUse[]>,
    blueprint: Blueprint,
    fieldLabel?: (source: string, name: string) => string
) {
    const sources = Object.entries(blueprint?.sources ?? {}).filter(
        ([, s]) => s.dataset === ds.name
    );
    const roots: PlainObject[] = [],
        nodes: Record<string, PlainObject> = {},
        categoryNode = (path: string[]): PlainObject => {
            if (!path.length) return null;
            const id = `cat:${path.join('/')}`;
            if (!nodes[id]) {
                nodes[id] = {id, name: path.at(-1), children: []};
                const parent = categoryNode(path.slice(0, -1));
                (parent ? parent.children : roots).push(nodes[id]);
            }
            return nodes[id];
        };

    Object.values(ds.fields).forEach(f => {
        const fieldUses = uses[f.name] ?? [],
            row = {
                ...fieldRow(f, catalog),
                usedAt: pathsOf(fieldUses),
                children: [
                    ...instanceRows(f, fieldUses, sources, catalog, blueprint, fieldLabel),
                    ...overrideRows(f, sources, catalog, blueprint)
                ]
            },
            parent = categoryNode(f.category ? castArray(f.category) : []);
        (parent ? parent.children : roots).push(row);
    });

    // A category is used when any field in it is.
    const markCategories = (node: PlainObject): number => {
        if (!node.id.startsWith('cat:')) return node.usedAt ? 1 : 0;
        const count = node.children.reduce((n: number, c: PlainObject) => n + markCategories(c), 0);
        node.usedAt = count ? `${count} fields used` : null;
        return count;
    };
    roots.forEach(markCategories);
    return roots;
}

function fieldRow(f: FieldDef, catalog: DataCatalog) {
    const formatName = isString(f.format) ? f.format : null,
        opts = describeFormat(formatOf(f, catalog)),
        {label, align, width} = resolveFieldDisplay(f);
    return {
        id: `field:${f.name}`,
        name: f.name,
        label,
        align,
        width,
        type: f.type,
        kind: f.kind,
        format: [formatName, opts].filter(Boolean).join(': ') || null,
        aggregator: f.isDimension ? null : describeSpec(f.aggregator) || null,
        role: f.isDimension ? 'Dimension' : 'Measure',
        parentDimension: f.parentDimension,
        params: f.params
            ? Object.entries(f.params)
                  .map(([n, p]) => `${n}: ${p.type}${p.required ? '' : '?'}`)
                  .join(', ')
            : null,
        renderer: describeSpec(f.renderer) || null,
        deprecated: f.replacedBy ? `use ${f.replacedBy}` : f.deprecated ? 'deprecated' : null,
        guidance: [f.description, f.guidance].filter(Boolean).join(' ') || null
    };
}

function instanceRows(
    f: FieldDef,
    uses: FieldUse[],
    sources: [string, PlainObject][],
    catalog: DataCatalog,
    blueprint: Blueprint,
    fieldLabel: (source: string, name: string) => string
) {
    return Object.entries(
        groupBy(
            uses.filter(u => u.instance),
            'instance'
        )
    ).map(([name, instUses]) => {
        const [src, s] = sources.find(([, it]) => it.fields?.[name]) ?? [],
            inst = s?.fields[name] as FieldDisplayLayer,
            display = resolveFieldDisplay(f, inst);
        return {
            id: `instance:${f.name}:${name}`,
            name,
            label: inst?.label ?? fieldLabel?.(src, name) ?? display.label,
            align: display.align,
            width: display.width,
            type: f.type,
            kind: f.kind,
            format: describeFormat(resolveFormat(f, display.formats, {catalog, blueprint})),
            renderer: describeSpec(display.renderer) || null,
            role: 'Instance',
            params: describeParams(instUses.find(u => u.params)?.params),
            usedAt: pathsOf(instUses)
        };
    });
}

/** A row for each source that overrides how the field shows, with its display resolved. */
function overrideRows(
    f: FieldDef,
    sources: [string, PlainObject][],
    catalog: DataCatalog,
    blueprint: Blueprint
) {
    return sources
        .filter(([, s]) => s.fields?.[f.name] && !('field' in s.fields[f.name]))
        .map(([src, s]) => {
            const display = resolveFieldDisplay(f, s.fields[f.name] as FieldDisplayLayer);
            return {
                id: `override:${src}:${f.name}`,
                name: src,
                label: display.label,
                align: display.align,
                width: display.width,
                type: f.type,
                kind: f.kind,
                format: describeFormat(resolveFormat(f, display.formats, {catalog, blueprint})),
                renderer: describeSpec(display.renderer) || null,
                role: 'Override',
                usedAt: `/sources/${src}/fields/${f.name}`
            };
        });
}

/** A field's format as the catalog resolves it, before any blueprint or widget changes it. */
export function formatOf(field: FieldDef, catalog: DataCatalog): PlainObject {
    return resolveFormat(field, [], {catalog, blueprint: null});
}

function pathsOf(uses: FieldUse[]): string {
    return uses.length ? uses.map(u => u.path).join('\n') : null;
}

function describeParams(params: PlainObject): string {
    if (!params) return null;
    return Object.entries(params)
        .map(([k, v]) => `${k}: ${v?.$var ? `$${v.$var}` : JSON.stringify(v)}`)
        .join(', ');
}
