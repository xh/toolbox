import type {
    Blueprint,
    DataCatalog,
    DatasetDef,
    FieldDef,
    FieldDisplayLayer,
    FieldUse,
    FieldUsages
} from '@xh/hoist-chat-kit/blueprint';
import {fieldUsages, resolveFieldDisplay, resolveFormat} from '@xh/hoist-chat-kit/blueprint';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistModel, lookup, managed} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {bindable, computed} from '@xh/hoist/mobx';
import {castArray, groupBy, isEmpty, isString} from 'lodash';
import {BlueprintsPanelModel} from '../BlueprintsPanelModel';
import {datasetJoins, describeFormat, describeSpec} from './catalogFields';
import type {DatasetJoin} from './catalogFields';
import {markdownCol} from '../markdown';
import {catalogJson, datasetCards} from './CatalogViews';

/**
 * The Data Catalog the server serves, as the Blueprints tab loaded it: its datasets and their
 * fields with kind defaults resolved, its kinds and formats, and marks on what the current
 * blueprint uses.
 */
export class CatalogModel extends HoistModel {
    @lookup(BlueprintsPanelModel) panelModel: BlueprintsPanelModel;

    @managed tabContainerModel = new TabContainerModel({
        tabs: [
            {id: 'datasets', title: 'Datasets', content: () => datasetCards()},
            {id: 'kinds', title: 'Kinds', content: () => grid({model: this.kindsGridModel})},
            {id: 'formats', title: 'Formats', content: () => grid({model: this.formatsGridModel})},
            {id: 'json', title: 'JSON', content: () => catalogJson()}
        ]
    });

    /** One per dataset, in catalog order. */
    @managed datasetModels: DatasetCardModel[] = [];

    @managed kindsGridModel = new GridModel({
        store: {idSpec: 'name'},
        sortBy: 'name',
        columns: [
            {field: 'name', width: 110},
            {field: 'base', width: 110},
            {field: 'format', width: 220, tooltip: true},
            {field: 'aggregator', width: 140, tooltip: true},
            {field: 'renderer', width: 120},
            {field: 'fieldCount', headerName: 'Fields', width: 60, align: 'right'}
        ]
    });

    @managed formatsGridModel = new GridModel({
        store: {idSpec: 'name'},
        sortBy: 'name',
        columns: [
            {field: 'name', width: 110},
            {field: 'options', flex: 1, minWidth: 200, tooltip: true},
            {field: 'kinds', width: 140, tooltip: true}
        ]
    });

    get blueprint(): Blueprint {
        return this.panelModel.blueprintModel.blueprint;
    }

    get catalog(): DataCatalog {
        return this.panelModel.blueprintModel.catalog;
    }

    get catalogJson(): string {
        return JSON.stringify(this.catalog.json, null, 2);
    }

    @computed
    get usages(): FieldUsages {
        return fieldUsages(this.panelModel.blueprintModel.blueprint, this.catalog);
    }

    override onLinked() {
        const {catalog} = this;
        this.kindsGridModel.loadData(kindRows(catalog));
        this.formatsGridModel.loadData(formatRows(catalog));
        this.datasetModels = Object.values(catalog.datasets).map(
            (ds, idx) => new DatasetCardModel(ds, datasetJoins(catalog, ds), idx === 0)
        );
        this.addReaction({
            track: () => this.usages,
            run: usages => this.datasetModels.forEach(it => this.loadDataset(it, usages)),
            fireImmediately: true
        });
    }

    //------------------
    // Implementation
    //------------------
    private loadDataset(model: DatasetCardModel, usages: FieldUsages) {
        const {ds} = model,
            uses = usages[ds.name] ?? {};
        model.usedCount = Object.keys(uses).length;
        model.fieldsGridModel.loadData(
            fieldTree(ds, this.catalog, uses, this.blueprint, (src, name) =>
                this.panelModel.blueprintModel.getSource(src)?.fieldLabel(name)
            )
        );
    }
}

/** One dataset's card: whether it is expanded, and its fields grid. */
export class DatasetCardModel extends HoistModel {
    @bindable accessor expanded: boolean;
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
        expanded = false
    ) {
        super();
        this.expanded = expanded;
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

function kindRows(catalog: DataCatalog) {
    const fields = Object.values(catalog.datasets).flatMap(ds => Object.values(ds.fields));
    return Object.entries(catalog.kinds).map(([name, k]) => ({
        name,
        base: k.base,
        format: [
            describeSpec(k.format),
            describeFormat(formatOf({name, type: 'number', kind: name}, catalog))
        ]
            .filter(Boolean)
            .join(': '),
        aggregator: describeSpec(k.aggregator) || null,
        renderer: describeSpec(k.renderer) || null,
        fieldCount: new Set(fields.filter(f => f.kind === name).map(f => f.name)).size
    }));
}

function formatRows(catalog: DataCatalog) {
    return Object.entries(catalog.formats).map(([name, opts]) => ({
        name,
        options: describeFormat(opts),
        kinds:
            Object.entries(catalog.kinds)
                .filter(([, k]) => k.format === name)
                .map(([n]) => n)
                .join(', ') || null
    }));
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
