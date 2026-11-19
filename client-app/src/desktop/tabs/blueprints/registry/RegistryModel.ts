import type {BlueprintRegistry, FieldDef} from '@xh/hoist-chat-kit/blueprint';
import {ARCHITECT_TOOLS, architectPrompt} from '@xh/hoist-chat-kit/blueprint';
import type {ArchitectTarget} from '@xh/hoist-chat-kit/blueprint';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, lookup, managed} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import {bindable, computed} from '@xh/hoist/mobx';
import {isEmpty, isString} from 'lodash';
import type {ReactNode} from 'react';
import {BlueprintsPanelModel} from '../BlueprintsPanelModel';
import {resolveFieldFormat} from '../catalog/catalogFields';
import type {RegistryEntry, RegistryOrigin} from './registryEntries';
import {findRegistryUsages, registryEntries, sampleParams, schemaRows} from './registryEntries';

export type RegistryContext = 'dashboard' | 'answer';

const KIND_LABELS = {
    widget: '1 Widgets',
    variableType: '2 Variable types',
    resolver: '3 Resolvers',
    action: '4 Actions',
    renderer: '5 Renderers',
    presentation: '6 Presentations'
};

/**
 * The registries the Blueprints tab builds: the dashboard registry its blueprint renders with, and
 * the answer registry the Architect's answers render with. Lists each entry by kind and origin,
 * marks what the blueprint uses, and shows an entry as the Architect sees it.
 */
export class RegistryModel extends HoistModel {
    @lookup(BlueprintsPanelModel) panelModel: BlueprintsPanelModel;

    @bindable accessor context: RegistryContext = 'dashboard';
    @bindable accessor origins: RegistryOrigin[] = ['built-in', 'chat kit', 'app'];
    @bindable accessor showArchitect = false;
    @bindable accessor sampleValue: string = null;

    @managed listGridModel = new GridModel({
        store: {idSpec: 'id'},
        selModel: 'single',
        groupBy: 'kindLabel',
        groupRowRenderer: ({value}) => (value as string).replace(/^\d /, ''),
        sortBy: 'name',
        emptyText: 'No entries',
        columns: [
            {field: 'kindLabel', hidden: true},
            {
                field: 'usedAt',
                headerName: '✓',
                headerTooltip: 'Used by this blueprint',
                width: 36,
                align: 'center',
                renderer: v => (v ? '✓' : null),
                tooltip: v => v
            },
            {field: 'name', width: 150, tooltip: (v, {record}) => record.data.label},
            {field: 'label', hidden: true},
            {field: 'origin', width: 80}
        ]
    });

    @managed schemaGridModel = new GridModel({
        treeMode: true,
        expandLevel: 1,
        store: {idSpec: 'id'},
        emptyText: 'No schema',
        columns: [
            {field: 'name', isTreeColumn: true, width: 170},
            {field: 'type', width: 130, tooltip: true},
            {field: 'required', headerName: 'Req', width: 50, align: 'center'},
            {field: 'default', width: 90, tooltip: true},
            {field: 'annotations', width: 170, tooltip: true},
            {field: 'description', flex: 1, minWidth: 200, tooltip: true}
        ]
    });

    get blueprintModel() {
        return this.panelModel.blueprintModel;
    }

    get dashboardRegistry(): BlueprintRegistry {
        return this.blueprintModel.registry as BlueprintRegistry;
    }

    get answerRegistry(): BlueprintRegistry {
        return this.panelModel.answerCatalog.registry;
    }

    get registry(): BlueprintRegistry {
        return this.context === 'dashboard' ? this.dashboardRegistry : this.answerRegistry;
    }

    @computed
    get entries(): RegistryEntry[] {
        return registryEntries(this.registry, this.dashboardRegistry);
    }

    @computed
    get usages(): Record<string, string[]> {
        const {blueprint, catalog} = this.blueprintModel;
        return findRegistryUsages(blueprint, this.registry, catalog);
    }

    get selected(): RegistryEntry {
        const id = this.listGridModel.selectedId;
        return id ? (this.entries.find(it => it.id === id) ?? null) : null;
    }

    /** Where the blueprint uses the selected entry. */
    get selectedUsedAt(): string[] {
        return this.usages[this.selected?.id] ?? [];
    }

    /** The registry names each context holds an entry under. */
    isIn(context: RegistryContext, entry: RegistryEntry): boolean {
        const reg = context === 'dashboard' ? this.dashboardRegistry : this.answerRegistry;
        if (entry.kind === 'presentation') {
            return !!reg.widgets[entry.widget]?.presentations?.some(p => p.name === entry.name);
        }
        return !!reg[COLLECTION[entry.kind]][entry.name];
    }

    //------------------
    // What the Architect sees
    //------------------
    /** The index of the Architect's system prompt, as the Architect panel builds it. */
    @computed
    get architectIndex(): string {
        const {blueprintModel, panelModel} = this,
            prompt = architectPrompt({
                catalogs: blueprintModel.catalogs,
                registry: panelModel.answerCatalog.registry,
                withAnswers: true
            });
        return prompt.slice(prompt.indexOf('# What exists'));
    }

    /** What `describe_registry` returns for the selected entry, run on the Architect's target. */
    get describeRegistryOutput(): string {
        const entry = this.selected;
        if (!entry) return '';
        const tool = ARCHITECT_TOOLS.find(it => it.name === 'describe_registry'),
            kind = entry.kind === 'presentation' ? 'widget' : entry.kind,
            name = entry.kind === 'presentation' ? entry.widget : entry.name;
        try {
            const out = tool.run({kind, names: [name]}, this.blueprintModel as ArchitectTarget);
            return JSON.stringify(out, null, 2);
        } catch (e) {
            return `describe_registry failed: ${e.message}`;
        }
    }

    //------------------
    // Details
    //------------------
    /** The description an action's example would show, built by the blueprint model. */
    get actionSample(): string {
        const entry = this.selected;
        if (entry?.kind !== 'action') return null;
        const action = {type: entry.name, ...sampleParams(entry.spec.params)};
        try {
            return `${this.blueprintModel.describeAction(action)}  ←  ${JSON.stringify(action)}`;
        } catch (e) {
            return `${JSON.stringify(action)}: ${e.message}`;
        }
    }

    /** A resolver's value now: as each variable it computes holds it, or run with no args. */
    get resolverValue(): string {
        const entry = this.selected;
        if (entry?.kind !== 'resolver') return null;
        const vars = this.blueprintModel.variables.filter(v => {
            const d = v.decl as PlainObject;
            return d.default?.resolver === entry.name || d.compute?.resolver === entry.name;
        });
        if (vars.length) return vars.map(v => `${v.name} = ${JSON.stringify(v.value)}`).join(', ');
        if (!isEmpty(entry.spec.args)) return 'Needs args - not used by this blueprint';
        try {
            return JSON.stringify(entry.spec.resolve({}));
        } catch (e) {
            return e.message;
        }
    }

    /** The catalog kinds and fields a renderer draws. */
    get rendererUsers(): {kinds: string[]; fields: string[]; sampleField: FieldDef} {
        const entry = this.selected,
            {catalog} = this.blueprintModel;
        if (entry?.kind !== 'renderer') return null;
        const names = (spec: unknown) => (isString(spec) ? spec : (spec as PlainObject)?.name),
            kinds = Object.entries(catalog.kinds)
                .filter(([, k]) => names(k.renderer) === entry.name)
                .map(([n]) => n),
            fields: string[] = [];
        let sampleField: FieldDef = null;
        Object.values(catalog.datasets).forEach(ds =>
            Object.values(ds.fields).forEach(f => {
                if (names(f.renderer) !== entry.name) return;
                fields.push(`${ds.name}.${f.name}`);
                sampleField ??= f;
            })
        );
        return {kinds, fields, sampleField};
    }

    /** The selected renderer drawing the sample value, as for its first field. */
    get rendererSample(): ReactNode {
        const users = this.rendererUsers,
            spec = this.selected?.spec;
        if (!users || !spec?.render) return null;
        const field: FieldDef = users.sampleField ?? {
                name: 'sample',
                type: spec.appliesTo?.types?.[0] ?? 'string'
            },
            config = (
                field.renderer && !isString(field.renderer) ? field.renderer : {}
            ) as PlainObject,
            raw = this.sampleValue ?? defaultSample(field, config),
            value = field.type === 'number' || field.type === 'int' ? Number(raw) : raw;
        try {
            return spec.render(value, {
                field,
                config,
                format: resolveFieldFormat(field, this.blueprintModel.catalog),
                isAggregate: false,
                formatValue: (v: unknown) => (v == null ? '' : String(v))
            });
        } catch (e) {
            return e.message;
        }
    }

    /** Load the selected widget's example into an empty blueprint. */
    loadExample() {
        const entry = this.selected,
            example = entry?.spec.example;
        if (!example) return;
        const {catalog} = this.blueprintModel,
            source = example.config?.source,
            bp: PlainObject = {root: entry.name, elements: {[entry.name]: example}};
        const ds = isString(source) ? catalog.getDataset(source) : null;
        if (ds) {
            // A required date becomes a prompted variable that starts at today, so data loads.
            const dates = Object.keys(ds.params).filter(
                n => ds.params[n].required && ds.params[n].type === 'localDate'
            );
            bp.variables = Object.fromEntries(
                dates.map(n => [
                    n,
                    {type: 'localDate', setBy: 'prompt', default: {resolver: 'today'}}
                ])
            );
            bp.sources = {
                [source]: {
                    dataset: source,
                    params: Object.fromEntries(dates.map(n => [n, {$var: n}]))
                }
            };
        }
        this.panelModel.draft = JSON.stringify(bp, null, 4);
        this.panelModel.apply();
    }

    override onLinked() {
        this.addReaction(
            {
                track: () => [this.entries, this.usages, this.origins],
                run: () => this.loadList(),
                fireImmediately: true
            },
            {
                track: () => this.selected,
                run: entry => {
                    this.sampleValue = null;
                    const schema =
                        entry?.kind === 'action' ? entry.spec.params : entry?.spec.config;
                    this.schemaGridModel.loadData(schemaRows(schema));
                },
                fireImmediately: true
            }
        );
    }

    //------------------
    // Implementation
    //------------------
    private loadList() {
        const {entries, usages, origins} = this;
        this.listGridModel.loadData(
            entries
                .filter(it => origins.includes(it.origin))
                .map(it => ({
                    id: it.id,
                    kindLabel: KIND_LABELS[it.kind],
                    name: it.kind === 'presentation' ? `${it.widget}.${it.name}` : it.name,
                    label: it.label,
                    origin: it.origin,
                    usedAt: usages[it.id]?.join('\n') ?? null
                }))
        );
        if (!this.listGridModel.selectedRecord) this.listGridModel.selectFirstAsync();
    }
}

const COLLECTION = {
    widget: 'widgets',
    variableType: 'variableTypes',
    resolver: 'resolvers',
    action: 'actions',
    renderer: 'renderers'
};

function defaultSample(field: FieldDef, config: PlainObject): string {
    const intents = config.intents as PlainObject;
    if (intents) return Object.keys(intents)[0];
    if (field.type === 'number' || field.type === 'int') return '0.05';
    return field.label ?? field.name;
}
