import {widgetPreview} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import type {Blueprint, BlueprintRegistry, FieldDef} from '@xh/hoist-chat-kit/blueprint';
import {
    ARCHITECT_TOOLS,
    architectPrompt,
    BlueprintModel,
    exampleBlueprintOf,
    registryUsages,
    variableLabel
} from '@xh/hoist-chat-kit/blueprint';
import type {ArchitectTarget, BlueprintSelection} from '@xh/hoist-chat-kit/blueprint';
import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, lookup, managed, XH} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {action, bindable, computed, observable, observableRef} from '@xh/hoist/mobx';
import {castArray, isEmpty, isString, sortBy} from 'lodash';
import type {ReactNode} from 'react';
import {BlueprintShellModel} from '../BlueprintShellModel';
import {formatOf} from '../catalog/CatalogModel';
import type {RegistryEntry, RegistryKind, RegistryOrigin} from './registryEntries';
import {registryEntries, sampleParams} from './registryEntries';
import {schemaSections} from './registrySchema';
import type {SchemaSection} from './registrySchema';
import {entryName, usedBadge} from './RegistryViews';

export type RegistryContext = 'dashboard' | 'answer';

const KIND_LABELS: Record<RegistryKind, string> = {
    widget: 'Widgets',
    variableType: 'Variable types',
    resolver: 'Resolvers',
    action: 'Actions',
    renderer: 'Renderers',
    presentation: 'Presentations'
};

const KIND_ORDER = Object.values(KIND_LABELS);

/**
 * The registries the Blueprints tab builds: the dashboard registry its blueprint renders with, and
 * the answer registry the Architect's answers render with. Lists each entry by kind and origin,
 * marks what the blueprint uses, and shows an entry as the Architect sees it.
 */
export class RegistryModel extends HoistModel {
    @lookup(BlueprintShellModel) panelModel: BlueprintShellModel;

    @bindable accessor context: RegistryContext = 'dashboard';
    @bindable accessor origins: RegistryOrigin[] = ['built-in', 'chat kit', 'app'];
    @bindable accessor sampleValue: string = null;

    /** Text that narrows the entries to those whose name or label holds it. */
    @bindable accessor query = '';

    /** The entry the detail shows. */
    @bindable accessor selectedId: string = null;

    /** The selected widget's example, rendered live. */
    @observableRef accessor exampleModel: BlueprintModel = null;

    /** Why the selected widget's example could not render, if it couldn't. */
    @observable accessor exampleError: string = null;

    /** True if the selected widget's example names children it does not carry. */
    @observable accessor exampleNeedsBlueprint = false;

    @managed listModel = new GridModel({
        store: {idSpec: 'id'},
        groupBy: 'group',
        groupSortFn: (a, b) => KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b),
        hideHeaders: true,
        emptyText: 'No entries match.',
        columns: [
            {field: 'group', hidden: true},
            {
                field: 'name',
                flex: 1,
                rendererIsComplex: true,
                renderer: (v, {record}) => {
                    const {label, origin, kind} = record.data,
                        spec = kind === 'widget' ? this.registry.widgets[v] : null;
                    return entryName(
                        v,
                        label,
                        origin,
                        spec ? widgetPreview(spec, {width: 48, height: 16}) : null
                    );
                }
            },
            {field: 'label', hidden: true},
            {field: 'origin', hidden: true},
            {field: 'kind', hidden: true},
            {
                field: 'used',
                width: 70,
                align: 'right',
                rendererIsComplex: true,
                renderer: (v, {record}) =>
                    v ? usedBadge(v as number, record.data.usedAt as string[]) : null
            },
            {field: 'usedAt', hidden: true}
        ]
    });

    /** "What the Architect sees", beside the entry. Closed by default, and kept per user. */
    @managed architectPanelModel = new PanelModel({
        side: 'right',
        defaultSize: 400,
        minSize: 260,
        defaultCollapsed: true,
        persistWith: {localStorageKey: 'tbBlueprintsRegistryArchitect'}
    });

    /** The section of the entry's page the index marks: the one at the top of the scroll. */
    @bindable accessor activeAnchor: string = null;

    /** A section to bring into view once it renders. */
    @observableRef accessor scrollTarget: string = null;

    /** The paths of the property cards shown open. */
    @observableRef accessor expanded: Set<string> = new Set();

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
        return registryUsages(blueprint, this.registry, catalog);
    }

    get selected(): RegistryEntry {
        const id = this.selectedId;
        return id ? (this.entries.find(it => it.id === id) ?? null) : null;
    }

    /** The entries shown, by kind in registry order, each with where the blueprint uses it. */
    @computed
    get sections(): RegistrySection[] {
        const {usages, origins} = this,
            q = (this.query ?? '').trim().toLowerCase(),
            shown = this.entries.filter(
                it =>
                    origins.includes(it.origin) &&
                    (!q || [displayName(it), it.label].some(t => t?.toLowerCase().includes(q)))
            );
        return Object.entries(KIND_LABELS).flatMap(([kind, label]) => {
            const entries = sortBy(
                shown.filter(it => it.kind === kind),
                displayName
            ).map(entry => ({entry, name: displayName(entry), usedAt: usages[entry.id] ?? []}));
            return entries.length ? [{kind: kind as RegistryKind, label, entries}] : [];
        });
    }

    /** How many entries each origin has in the registry shown. */
    @computed
    get originCounts(): Record<RegistryOrigin, number> {
        const ret = {'built-in': 0, 'chat kit': 0, app: 0} as Record<RegistryOrigin, number>;
        this.entries.forEach(it => ret[it.origin]++);
        return ret;
    }

    @action
    toggleOrigin(origin: RegistryOrigin) {
        const {origins} = this;
        this.origins = origins.includes(origin)
            ? origins.filter(it => it !== origin)
            : [...origins, origin];
    }

    /** The sections of the selected entry's page, in order, each one it has. */
    get pageSections(): {id: string; title: string}[] {
        const entry = this.selected,
            spec = entry?.spec ?? {},
            widget = entry?.kind === 'widget';
        return [
            {id: 'config', title: entry?.kind === 'action' ? 'Parameters' : 'Config'},
            widget && !isEmpty(spec.children?.slots) ? {id: 'slots', title: 'Slots'} : null,
            widget && !isEmpty(spec.outputs) ? {id: 'outputs', title: 'Outputs'} : null,
            widget ? {id: 'presets', title: 'Presets and sizes'} : null,
            {id: 'usage', title: 'Usage'}
        ].filter(Boolean);
    }

    /** The selected entry's config, or an action's parameters, in the Inspector's setting groups. */
    @computed
    get schemaSections(): SchemaSection[] {
        const entry = this.selected;
        if (!entry) return [];
        const {spec} = entry;
        return entry.kind === 'action'
            ? schemaSections(spec.params)
            : schemaSections(spec.config, spec.sections, spec.presetPaths);
    }

    @action
    toggleExpanded(path: string) {
        const next = new Set(this.expanded);
        next.has(path) ? next.delete(path) : next.add(path);
        this.expanded = next;
    }

    /** Select an element or source of the draft open, in the editor. */
    reveal(selection: BlueprintSelection) {
        this.panelModel.designModel.select(selection);
        this.panelModel.showEditor();
    }

    @action
    goTo(section: string) {
        this.activeAnchor = section;
        this.scrollTarget = section;
    }

    @action
    clearScrollTarget() {
        this.scrollTarget = null;
    }

    /** True if the selected entry can be added to the draft open: a dashboard widget. */
    get canAddToDraft(): boolean {
        const entry = this.selected;
        return (
            this.context === 'dashboard' &&
            !!this.panelModel.draftName &&
            entry?.kind === 'widget' &&
            this.isIn('dashboard', entry)
        );
    }

    /** Add the selected widget to the draft open, at the editor's add target, and show it there. */
    addToDraft() {
        const {panelModel, selected} = this,
            {blueprintModel, designModel} = panelModel;
        if (blueprintModel.mode !== 'design') blueprintModel.setMode('design');
        const {issues, id} = designModel.addWidget(selected.name),
            error = issues.find(it => it.severity === 'error');
        if (error) {
            XH.dangerToast(error.message);
            return;
        }
        designModel.select({kind: 'element', id});
        panelModel.showEditor();
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
            const out = tool.run({kind, names: [name]}, this.blueprintModel as ArchitectTarget, {
                answerRegistry: this.answerRegistry
            });
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
        if (vars.length) return vars.map(v => `${v.name} = ${valueText(v.value)}`).join(', ');
        if (!isEmpty(entry.spec.args)) {
            return 'Takes arguments, so it has no value of its own. Use it in a variable to see one.';
        }
        try {
            return valueText(entry.spec.resolve({}));
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

    // The field a renderer's sample is drawn as, and that field's renderer config.
    private get rendererSetup(): {field: FieldDef; config: PlainObject} {
        const users = this.rendererUsers,
            spec = this.selected?.spec;
        if (!users) return null;
        const field: FieldDef = users.sampleField ?? {
            name: 'sample',
            type: spec.appliesTo?.types?.[0] ?? 'string'
        };
        return {
            field,
            config: (field.renderer && !isString(field.renderer)
                ? field.renderer
                : {}) as PlainObject
        };
    }

    /** The selected renderer drawing the sample value, as for its first field. */
    get rendererSample(): ReactNode {
        const spec = this.selected?.spec,
            setup = this.rendererSetup;
        if (!setup || !spec?.render) return null;
        const {field, config} = setup,
            raw = this.sampleValue ?? defaultSample(field, config),
            value = field.type === 'number' || field.type === 'int' ? Number(raw) : raw;
        try {
            return spec.render(value, {
                field,
                config,
                format: formatOf(field, this.blueprintModel.catalog),
                isAggregate: false,
                formatValue: (v: unknown) => (v == null ? '' : String(v))
            });
        } catch (e) {
            return e.message;
        }
    }

    /** Add the selected widget's example to the library as a new blueprint, and open it. */
    loadExample() {
        const entry = this.selected,
            bp = this.exampleBlueprint(entry);
        if (!bp) return;
        this.panelModel.createBlueprintAsync(`Example - ${entry.label ?? entry.name}`, bp);
    }

    override onLinked() {
        this.addReaction(
            {
                // A link may name the entry to show, by its ID or its name, such as from a
                // Built-ins page. Tracked until the entries load, as a cold link comes first.
                track: () => {
                    const want = XH.routerState?.params?.entry as string;
                    if (!want) return null;
                    const {entries} = this;
                    return (
                        entries.find(it => it.id === want) ?? entries.find(it => it.name === want)
                    )?.id;
                },
                run: id => {
                    if (!id) return;
                    this.selectedId = id;
                    this.listModel.selModel.select(id);
                },
                fireImmediately: true
            },
            {
                track: () => this.selected,
                run: entry => {
                    const setup = this.rendererSetup;
                    this.sampleValue = setup ? defaultSample(setup.field, setup.config) : null;
                    this.showExample(entry);
                    this.expanded = new Set();
                    this.goTo('config');
                },
                fireImmediately: true
            },
            {
                track: () => this.sections,
                run: sections => this.loadList(sections),
                fireImmediately: true
            },
            {
                track: () => this.listModel.selectedRecord,
                run: rec => {
                    if (rec) this.selectedId = rec.id as string;
                },
                fireImmediately: true
            },
            {
                // The address names the entry shown, so a reload or a copied link returns to it.
                track: () => this.selectedId,
                run: id => {
                    const route = this.panelModel.pageRoutes?.registry,
                        state = XH.routerState;
                    if (!id || state?.name !== route || state.params?.entry === id) return;
                    XH.navigate(route, {...state.params, entry: id}, {replace: true});
                }
            }
        );
    }

    override destroy() {
        XH.safeDestroy(this.exampleModel);
        super.destroy();
    }

    //------------------
    // Implementation
    //------------------
    private loadList(sections: RegistrySection[]) {
        const {listModel} = this,
            rows = sections.flatMap(({label, entries}) =>
                entries.map(({entry, name, usedAt}) => ({
                    id: entry.id,
                    group: label,
                    name,
                    label: entry.label && entry.label !== name ? entry.label : null,
                    origin: entry.origin,
                    kind: entry.kind,
                    used: usedAt.length,
                    usedAt
                }))
            );
        listModel.loadData(rows);
        const keep = rows.some(it => it.id === this.selectedId);
        listModel.selModel.select(keep ? this.selectedId : (rows[0]?.id ?? null));
    }

    /** Why a variable type has no example: it has no prompt input, so a widget must set it. */
    get noInputReason(): string {
        const entry = this.selected;
        if (
            entry?.kind !== 'variableType' ||
            entry.spec.input ||
            entry.spec.matches !== entry.name
        ) {
            return null;
        }
        const setters = Object.entries(this.registry.widgets)
            .filter(([, w]) => castArray(w.value?.type ?? []).includes(entry.name))
            .map(([name]) => name);
        return `It has no prompt input${setters.length ? `. Set it from a ${setters.join(' or ')}.` : '.'}`;
    }

    private exampleBlueprint(entry: RegistryEntry): Blueprint {
        if (entry?.kind === 'variableType') {
            return this.noInputReason ? null : variableTypeExample(entry);
        }
        if (entry?.kind !== 'widget') return null;
        return exampleBlueprintOf({...entry.spec, name: entry.name}, this.blueprintModel.catalog)
            .blueprint;
    }

    @action
    private showExample(entry: RegistryEntry) {
        XH.safeDestroy(this.exampleModel);
        this.exampleModel = null;
        this.exampleError = null;
        this.exampleNeedsBlueprint =
            entry?.kind === 'widget' && !!entry.spec.example && !this.exampleBlueprint(entry);
        const blueprint = this.exampleBlueprint(entry);
        if (!blueprint) return;
        const {catalog, dataProvider} = this.blueprintModel,
            {registry} = this;
        try {
            this.exampleModel = new BlueprintModel({blueprint, catalog, registry, dataProvider});
        } catch (e) {
            this.exampleError = e.message;
        }
    }
}

export interface RegistrySection {
    kind: RegistryKind;
    label: string;
    entries: {entry: RegistryEntry; name: string; usedAt: string[]}[];
}

function displayName(it: RegistryEntry): string {
    return it.kind === 'presentation' ? `${it.widget}.${it.name}` : it.name;
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
    return SAMPLES_BY_KIND[field.kind] ?? field.label ?? field.name;
}

// Sample values that read as real ones, by catalog kind.
const SAMPLES_BY_KIND: Record<string, string> = {ticker: 'NVDA', identifier: 'US67066G1040'};

// A variable of the type set by its prompt, which draws the type's input, over its value.
function variableTypeExample(entry: RegistryEntry): Blueprint {
    return {
        variables: {
            value: {
                type: entry.name,
                label: entry.spec.label ?? variableLabel(entry.name.split('.').pop()),
                setBy: 'prompt'
            }
        },
        root: 'value',
        elements: {value: {component: 'markdown', config: {text: '`value` = {value}'}}}
    } as Blueprint;
}

// A value as one reads it: a string as is, anything else as JSON.
function valueText(value: unknown): string {
    return isString(value) ? value : JSON.stringify(value);
}
