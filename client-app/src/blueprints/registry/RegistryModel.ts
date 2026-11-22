import type {Blueprint, BlueprintRegistry, FieldDef} from '@xh/hoist-chat-kit/blueprint';
import {
    ARCHITECT_TOOLS,
    architectPrompt,
    BlueprintModel,
    exampleBlueprintOf,
    registryUsages
} from '@xh/hoist-chat-kit/blueprint';
import type {ArchitectTarget} from '@xh/hoist-chat-kit/blueprint';
import {GridModel} from '@xh/hoist/cmp/grid';
import {TabContainerModel} from '@xh/hoist/cmp/tab';
import {HoistModel, lookup, managed, XH} from '@xh/hoist/core';
import type {PlainObject} from '@xh/hoist/core';
import {action, bindable, computed, observable, observableRef} from '@xh/hoist/mobx';
import {isEmpty, isString, sortBy} from 'lodash';
import type {ReactNode} from 'react';
import {BlueprintShellModel} from '../BlueprintShellModel';
import type {ShownJson} from '../jsonDialog';
import {formatOf} from '../catalog/CatalogModel';
import type {RegistryEntry, RegistryKind, RegistryOrigin} from './registryEntries';
import {registryEntries, sampleParams, schemaRows} from './registryEntries';
import {
    entryArchitect,
    entryConfig,
    entryExample,
    entryJsonText,
    entryName,
    entryOutputs,
    usedBadge
} from './RegistryViews';

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

    // The detail tab the user last picked, which entries keep showing while they have it.
    private pickedTab: string = null;
    // The tab last shown for a new entry, which is not a pick.
    private autoTab: string = null;

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
                renderer: (v, {record}) => entryName(v, record.data.label, record.data.origin)
            },
            {field: 'label', hidden: true},
            {field: 'origin', hidden: true},
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

    @managed detailTabsModel = new TabContainerModel({
        tabs: [
            {id: 'example', title: 'Example', content: () => entryExample()},
            {id: 'config', title: 'Config', content: () => entryConfig()},
            {id: 'outputs', title: 'Outputs and presets', content: () => entryOutputs()},
            {id: 'architect', title: 'What the Architect sees', content: () => entryArchitect()}
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

    /** The JSON the dialog shows, or null. */
    @observableRef accessor shownJson: ShownJson = null;

    /** How many entries each origin has in the registry shown. */
    @computed
    get originCounts(): Record<RegistryOrigin, number> {
        const ret = {'built-in': 0, 'chat kit': 0, app: 0} as Record<RegistryOrigin, number>;
        this.entries.forEach(it => ret[it.origin]++);
        return ret;
    }

    showEntryJson() {
        const entry = this.selected;
        if (entry)
            this.shownJson = {title: `${entry.name} (${entry.kind})`, json: entryJsonText(entry)};
    }

    closeJson() {
        this.shownJson = null;
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
                // A link may name the entry to show, such as from a Built-ins page.
                track: () => XH.routerState?.params?.entry as string,
                run: entry => {
                    if (entry && this.entries.some(it => it.id === entry)) {
                        this.selectedId = entry;
                        this.listModel.selModel.select(entry);
                    }
                },
                fireImmediately: true
            },
            {
                track: () => this.selected,
                run: entry => {
                    this.sampleValue = null;
                    this.showExample(entry);
                    const schema =
                        entry?.kind === 'action' ? entry.spec.params : entry?.spec.config;
                    this.schemaGridModel.loadData(schemaRows(schema));
                    this.enableTabs(entry);
                },
                fireImmediately: true
            },
            {
                track: () => this.sections,
                run: sections => this.loadList(sections),
                fireImmediately: true
            },
            {
                track: () => this.detailTabsModel.activeTabId,
                run: id => {
                    if (id !== this.autoTab) this.pickedTab = id;
                }
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
                    used: usedAt.length,
                    usedAt
                }))
            );
        listModel.loadData(rows);
        const keep = rows.some(it => it.id === this.selectedId);
        listModel.selModel.select(keep ? this.selectedId : (rows[0]?.id ?? null));
    }

    // Disable the tabs an entry has nothing for. Show the tab the user picked while the entry has
    // it, else its example, else its config.
    @action
    private enableTabs(entry: RegistryEntry) {
        const {detailTabsModel: tabs, pickedTab} = this,
            kind = entry?.kind,
            has = {
                example:
                    (kind === 'widget' && !!entry.spec.example) ||
                    ['renderer', 'action', 'resolver'].includes(kind),
                outputs: kind === 'widget'
            };
        tabs.findTab('example').setDisabled(!has.example);
        tabs.findTab('outputs').setDisabled(!has.outputs);
        const want =
            pickedTab && !tabs.findTab(pickedTab).disabled
                ? pickedTab
                : has.example
                  ? 'example'
                  : 'config';
        this.autoTab = want;
        tabs.activateTab(want);
    }

    private exampleBlueprint(entry: RegistryEntry): Blueprint {
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
        const blueprint = this.context === 'dashboard' ? this.exampleBlueprint(entry) : null;
        if (!blueprint) return;
        const {catalog, registry, dataProvider} = this.blueprintModel;
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
    return field.label ?? field.name;
}
