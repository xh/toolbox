import type {
    Blueprint,
    BlueprintSelection,
    DataCatalog,
    DatasetDef,
    FieldDef,
    FieldUsages
} from '@xh/hoist-chat-kit/blueprint';
import {fieldUsages, formatValue, resolveFormat} from '@xh/hoist-chat-kit/blueprint';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, lookup, managed, XH} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {action, bindable, computed, observableRef} from '@xh/hoist/mobx';
import {isEmpty} from 'lodash';
import type {ReactNode} from 'react';
import {BlueprintShellModel} from '../BlueprintShellModel';
import {
    catalogEntries,
    datasetJoins,
    datasetUsers,
    describeFormat,
    describeSpec,
    fieldGroups,
    sampleValues
} from './catalogFields';
import type {DatasetJoin, FieldGroup} from './catalogFields';
import {catalogEntryName} from './CatalogViews';

/** What the JSON panel shows and the detail highlights. */
export type CatalogItem =
    | {kind: 'dataset'; name: string}
    | {kind: 'field'; dataset: string; name: string}
    | {kind: 'kind'; name: string}
    | {kind: 'format'; name: string}
    | {kind: 'catalog'};

/** The list entry for the page of kinds and formats. */
export const KINDS_AND_FORMATS = 'kindsAndFormats';

/**
 * The Data Catalog the server serves, as the Blueprints tab loaded it: a list of its datasets, and
 * one page of its kinds and formats, beside the detail of the one selected and its JSON.
 */
export class CatalogModel extends HoistModel {
    @lookup(BlueprintShellModel) panelModel: BlueprintShellModel;

    /** One per dataset, in catalog order. */
    @managed datasetModels: DatasetCardModel[] = [];

    /** Filters datasets, by their names and their fields'. */
    @bindable accessor query = '';

    /** The list entry the detail shows: `dataset:<name>`, or `KINDS_AND_FORMATS`. */
    @bindable accessor selectedId: string = null;

    /** How a dataset's fields group: by the catalog's field groups, or by kind. */
    @bindable accessor fieldsGrouping: 'group' | 'kind' = 'group';

    /** The dataset, field, kind or format selected in the detail, which the JSON panel shows. */
    @observableRef accessor item: CatalogItem = null;

    /** The kind or format card the kinds and formats page shows at its top, as `<kind>:<name>`. */
    @bindable accessor activeAnchor: string = null;

    /** A card to bring into view once it renders, as its anchor id. */
    @observableRef accessor scrollTarget: string = null;

    @managed jsonPanelModel = new PanelModel({
        side: 'right',
        defaultSize: 340,
        minSize: 240,
        defaultCollapsed: true,
        persistWith: {localStorageKey: 'tbBlueprintsCatalogJson'}
    });

    @managed listModel = new GridModel({
        store: {idSpec: 'id'},
        treeMode: true,
        treeStyle: 'none',
        expandLevel: 1,
        hideHeaders: true,
        stripeRows: false,
        emptyText: 'Nothing matches.',
        rowClassFn: rec => `xh-blueprint-tree__row--${rec?.data.type}`,
        columns: [
            {
                field: 'name',
                isTreeColumn: true,
                flex: 1,
                rendererIsComplex: true,
                renderer: (v, {record}) => catalogEntryName(v, record.data.meta)
            },
            {field: 'type', hidden: true},
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

    /** The selected dataset's model, if a dataset is selected. */
    get selectedDataset(): DatasetCardModel {
        const id = this.selectedId;
        return id?.startsWith('dataset:')
            ? (this.datasetModels.find(it => `dataset:${it.ds.name}` === id) ?? null)
            : null;
    }

    /** The open blueprint's sources over the selected dataset, and the elements reading them. */
    @computed
    get users(): {sources: string[]; elements: string[]} {
        return datasetUsers(this.blueprint, this.selectedDataset?.ds.name);
    }

    /** The kinds and formats the catalog's fields use, in catalog order. */
    @computed
    get kindsAndFormats(): {kinds: string[]; formats: string[]} {
        const entries = catalogEntries(this.catalog, '', {});
        return {
            kinds: entries.filter(it => it.kind === 'kind').map(it => it.name),
            formats: entries.filter(it => it.kind === 'format').map(it => it.name)
        };
    }

    /** The JSON panel's title and text, for the item selected. */
    @computed
    get json(): {title: string; text: string} {
        const {item, catalog} = this,
            {json} = catalog;
        if (!item) return null;
        const [title, value] =
            item.kind === 'catalog'
                ? ['Data Catalog', json]
                : item.kind === 'field'
                  ? [item.name, fieldJson(json.datasets?.[item.dataset], item.name)]
                  : [item.name, json[`${item.kind}s`]?.[item.name]];
        return {title, text: JSON.stringify(value ?? null, null, 2)};
    }

    /** The fields that carry a kind, as `dataset.field`. */
    fieldsOfKind(kind: string): {dataset: string; field: string}[] {
        return Object.values(this.catalog.datasets).flatMap(ds =>
            Object.values(ds.fields)
                .filter(f => f.kind === kind)
                .map(f => ({dataset: ds.name, field: f.name}))
        );
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

    /** A positive, a negative and a large number, as a format, or a kind's format, shows each. */
    samples(spec: {format?: string; kind?: string}): {value: number; text: ReactNode}[] {
        const {catalog} = this,
            field = {name: 'sample', type: 'number', ...spec} as FieldDef,
            opts = resolveFormat(field, [], {catalog, blueprint: null});
        return sampleValues(opts).map(value => ({
            value,
            text: formatValue(value, field, opts, catalog)
        }));
    }

    /** A kind's format: its name, or its resolved options, as one line. */
    kindFormat(kind: string): string {
        const k = this.catalog.kinds[kind];
        return (
            describeSpec(k?.format) ||
            describeFormat(
                formatOf({name: kind, type: 'number', kind} as FieldDef, this.catalog)
            ) ||
            null
        );
    }

    /** Select a dataset, field, kind or format in the detail, which the JSON panel follows. */
    @action
    selectItem(item: CatalogItem) {
        this.item = item;
    }

    /** Select an item and open the JSON panel on it. */
    @action
    showJson(item: CatalogItem) {
        this.item = item;
        this.jsonPanelModel.setCollapsed(false);
    }

    /** Show a dataset's field, as from a kind's Used-by chip. */
    @action
    openField(dataset: string, field: string) {
        this.select(`dataset:${dataset}`);
        this.item = {kind: 'field', dataset, name: field};
        this.scrollTarget = `field:${dataset}.${field}`;
    }

    /** Bring a kind or format card into view, as from the index. */
    @action
    goTo(anchor: string) {
        this.activeAnchor = anchor;
        this.scrollTarget = anchor;
        const [kind, name] = anchor.split(':') as ['kind' | 'format', string];
        this.item = {kind, name};
    }

    @action
    clearScrollTarget() {
        this.scrollTarget = null;
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
                track: () => [this.query, this.usages],
                run: () => this.loadList(),
                fireImmediately: true
            },
            {
                track: () => this.listModel.selectedRecord,
                run: rec => {
                    if (rec && rec.data.type !== 'category') this.selectedId = rec.id as string;
                },
                fireImmediately: true
            },
            {
                track: () => this.selectedId,
                run: id => {
                    if (id?.startsWith('dataset:')) {
                        if (this.item?.kind !== 'field') {
                            this.item = {kind: 'dataset', name: id.slice('dataset:'.length)};
                        }
                    } else if (id === KINDS_AND_FORMATS) {
                        const first = this.kindsAndFormats.kinds[0];
                        this.activeAnchor = first ? `kind:${first}` : null;
                        this.item = first ? {kind: 'kind', name: first} : null;
                    }
                },
                fireImmediately: true
            }
        );
    }

    //------------------
    // Implementation
    //------------------
    private loadList() {
        const {listModel, usages} = this,
            datasets = catalogEntries(this.catalog, this.query, usages).filter(
                it => it.kind === 'dataset'
            ),
            rows = [
                {
                    id: 'cat:datasets',
                    type: 'category',
                    name: 'Datasets',
                    meta: String(datasets.length),
                    children: datasets.map(it => ({...it, type: 'leaf'}))
                },
                {
                    id: 'cat:kindsAndFormats',
                    type: 'category',
                    name: 'Kinds & formats',
                    children: [
                        {
                            id: KINDS_AND_FORMATS,
                            type: 'leaf',
                            name: 'All kinds and formats',
                            meta: null
                        }
                    ]
                }
            ];
        listModel.loadData(rows);
        const ids = [...datasets.map(it => it.id), KINDS_AND_FORMATS];
        listModel.selModel.select(ids.includes(this.selectedId) ? this.selectedId : ids[0]);
    }
}

/** One dataset's detail: its fields in groups, parameters and joins. */
export class DatasetCardModel extends HoistModel {
    get fieldCount(): number {
        return Object.keys(this.ds.fields).length;
    }

    get description(): string {
        return [this.ds.description, this.ds.guidance].filter(Boolean).join(' ') || null;
    }

    get params(): ParamInfo[] {
        return paramRows(this.ds.params);
    }

    /** The fields in groups, as the catalog model's grouping has them. */
    get groups(): FieldGroup[] {
        return fieldGroups(this.ds, this.catalogModel.catalog, this.catalogModel.fieldsGrouping);
    }

    /** Where the open blueprint uses a field, one path per line, or null. */
    usedAt(field: string): string {
        const uses = this.catalogModel.usages[this.ds.name]?.[field] ?? [];
        return uses.length ? uses.map(u => u.path).join('\n') : null;
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
    label: string;
    type: string;
    required: boolean;
    kind: string;
    options: string;
    description: string;
}

/** A field's format as the catalog resolves it, before any blueprint or widget changes it. */
export function formatOf(field: FieldDef, catalog: DataCatalog): PlainObject {
    return resolveFormat(field, [], {catalog, blueprint: null});
}

//------------------
// Implementation
//------------------
function paramRows(params: DatasetDef['params']): ParamInfo[] {
    return Object.entries(params ?? {}).map(([name, p]) => ({
        name,
        label: p.label,
        type: p.type,
        required: !!p.required,
        kind: p.kind,
        options: isEmpty(p.options) ? null : JSON.stringify(p.options),
        description: p.description
    }));
}

// A field as the catalog serves it: in its dataset's list, by name or as a shared field's entry.
function fieldJson(dsJson: PlainObject, name: string): unknown {
    const entry = dsJson?.fields?.find?.((it: unknown) =>
        typeof it === 'string' ? it === name : (it as PlainObject)?.name === name
    );
    return entry ?? null;
}
