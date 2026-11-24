import type {
    Blueprint,
    BlueprintElement,
    BlueprintRegistry,
    DataCatalog,
    WidgetSpec
} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintModel, DASHBOARD_COLUMNS, rescaleCells} from '@xh/hoist-chat-kit/blueprint';
import {blueprintView, thumbnailPreview} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {div, filler, hbox, hframe, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, uses, XH} from '@xh/hoist/core';
import type {ElementFactory, LoadSpec, PlainObject} from '@xh/hoist/core';
import {
    intentInput,
    numberInput,
    radioCardInput,
    segmentedControl,
    select
} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, observableRef, runInAction} from '@xh/hoist/mobx';
import classNames from 'classnames';
import {groupBy, upperFirst} from 'lodash';
import {useRef} from 'react';
import {PORTFOLIO_TYPE} from '../../../../blueprints/blueprintTypes';
import {createRepository} from '../../../../blueprints/repository/createRepository';
import {anchorProps, topAnchor, useScrollTarget} from '../../../../blueprints/scrollSpy';
import {ServerDataProvider} from '../../../../blueprints/ServerDataProvider';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {CONCEPT_PAGES} from '../concepts/conceptPages';
import {portfolioCatalogAsync} from '../portfolioCatalog';
import {builtinExample, INPUTS_OVERVIEW} from './builtinExamples';
import {roleWidgetNames} from './builtinRoles';
import type {BuiltinRole} from './builtinRoles';
import {builtinSettings, minColumns} from './builtinSettings';
import type {BuiltinSetting} from './builtinSettings';

/** A Built-ins page: one widget, or every input at once, live, with its main settings to try. */
class BuiltinPageModel extends HoistModel {
    readonly registry: BlueprintRegistry = PORTFOLIO_TYPE.createRegistry();
    readonly spec: WidgetSpec;
    readonly settings: BuiltinSetting[];

    @observableRef accessor blueprintModel: BlueprintModel = null;
    @observableRef accessor blueprint: Blueprint = null;
    private original: Blueprint = null;
    private catalog: DataCatalog = null;

    constructor(
        readonly name: string,
        readonly role: BuiltinRole
    ) {
        super();
        const spec = this.registry.widgets[name];
        this.spec = spec ? {...spec, name} : null;
        this.settings = this.spec ? builtinSettings(this.spec) : [];
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        if (this.blueprintModel) return;
        const catalog = await portfolioCatalogAsync();
        if (loadSpec.isStale) return;
        const blueprint = builtinExample(this.name, this.registry, catalog);
        if (!blueprint) return;
        this.catalog = catalog;
        this.original = blueprint;
        this.open(blueprint);
    }

    /** A setting's value in the example: its root's, or its first child reference's. */
    settingValue(setting: BuiltinSetting): unknown {
        const root = this.root,
            holder = setting.perChild ? root?.children?.[0] : root?.config;
        return holder?.[setting.key] ?? setting.default;
    }

    @action
    set(setting: BuiltinSetting, value: unknown) {
        const {blueprint} = this,
            root = this.root,
            rescale = setting.key === 'columns' && root.children?.[0]?.w != null,
            children = rescale
                ? rescaleCells(
                      root.children,
                      (this.settingValue(setting) as number) ?? DASHBOARD_COLUMNS,
                      (value as number) ?? DASHBOARD_COLUMNS,
                      id => this.minWidth(id)
                  )
                : root.children,
            next = setting.perChild
                ? {
                      ...root,
                      children: root.children.map((it: PlainObject) => ({
                          ...it,
                          [setting.key]: value
                      }))
                  }
                : {...root, children, config: {...root.config, [setting.key]: value}};
        this.apply({
            ...blueprint,
            elements: {...blueprint.elements, [blueprint.root]: next as BlueprintElement}
        });
    }

    /** The fewest columns the example's canvas can have: its widest cell's minimum width. */
    get minColumns(): number {
        const cells: PlainObject[] = this.root?.children ?? [];
        return minColumns(cells.map(it => this.minWidth(it.id)));
    }

    // An element's widget's minimum width on a canvas, as the Inspector's rescale takes it.
    private minWidth(id: string): number {
        const el = this.blueprint?.elements[id];
        return this.registry.widgets[el?.component]?.size?.min?.w ?? 1;
    }

    /** Restore the example, dropping both setting changes and anything a user moved in it. */
    reset() {
        this.open(this.original);
    }

    override destroy() {
        XH.safeDestroy(this.blueprintModel);
        super.destroy();
    }

    private get root(): PlainObject {
        return this.blueprint?.elements[this.blueprint.root];
    }

    // A new model, since a user's moves live in the old one's state rather than in its blueprint.
    private open(blueprint: Blueprint) {
        const old = this.blueprintModel,
            model = new BlueprintModel({
                catalog: this.catalog,
                registry: this.registry,
                dataProvider: new ServerDataProvider(),
                mode: 'run',
                access: 'read'
            });
        model.drillInRepository = createRepository(PORTFOLIO_TYPE.name);
        model.setBlueprint(blueprint);
        runInAction(() => {
            this.blueprintModel = model;
            this.blueprint = blueprint;
        });
        XH.safeDestroy(old);
    }

    private apply(blueprint: Blueprint) {
        const issues = this.blueprintModel.setBlueprint(blueprint) ?? [],
            error = issues.find(it => it.severity === 'error');
        if (error) {
            XH.dangerToast(`That setting was refused: ${error.message}`);
        } else {
            this.blueprint = blueprint;
        }
    }
}

/** A Built-ins role page: each widget of the role in sequence, with an index to jump between them. */
class BuiltinRolePageModel extends HoistModel {
    readonly pages: BuiltinPageModel[];

    /** The widget the index marks: the one at the top of the scroll. */
    @bindable accessor activeAnchor: string = null;

    /** A widget to bring into view once it renders. */
    @observableRef accessor scrollTarget: string = null;

    constructor(readonly role: BuiltinRole) {
        super();
        const registry = PORTFOLIO_TYPE.createRegistry();
        this.pages = roleWidgetNames(registry, role).map(name =>
            this.markManaged(new BuiltinPageModel(name, role))
        );
        this.activeAnchor = this.pages[0]?.name ?? null;
    }

    override async doLoadAsync() {
        await Promise.all(this.pages.map(it => it.loadAsync()));
    }

    override onLinked() {
        this.addReaction({
            track: () => XH.routerState,
            run: state => {
                const widget = state?.params?.widget;
                if (state?.name === builtinRoute(this.role) && widget) this.goTo(widget);
            },
            fireImmediately: true
        });
    }

    @action
    goTo(name: string) {
        this.activeAnchor = name;
        this.scrollTarget = name;
    }

    @action
    clearScrollTarget() {
        this.scrollTarget = null;
    }
}

/** A role's route name, under which `?widget=<name>` opens the page scrolled to that widget. */
export function builtinRoute(role: BuiltinRole): string {
    return `default.blueprints.builtin-${role.key}`;
}

/** A Built-ins role page's content. Each role has its own factory, which creates its model. */
export function builtinRolePageContent(role: BuiltinRole): ElementFactory {
    let ret = factories.get(role.key);
    if (!ret) {
        ret = hoistCmp.factory({
            displayName: 'BlueprintsBuiltinRolePage',
            model: creates(() => new BuiltinRolePageModel(role)),
            render: () => rolePage()
        });
        factories.set(role.key, ret);
    }
    return ret;
}

const factories = new Map<string, ElementFactory>();

const ANCHORS = 'tb-builtin';

const rolePage = hoistCmp.factory<BuiltinRolePageModel>({
    model: uses(BuiltinRolePageModel),
    render({model}) {
        const scrollRef = useRef<HTMLDivElement>(null);
        useScrollTarget(ANCHORS, model.scrollTarget, () => model.clearScrollTarget());
        return hframe({
            className: 'tb-builtins',
            children: [
                vbox({
                    className: 'tb-index',
                    children: [
                        hbox({
                            className: 'tb-index__head',
                            children: [
                                span(model.role.title),
                                filler(),
                                span(String(model.pages.length))
                            ]
                        }),
                        ...model.pages.map(({name}) =>
                            div({
                                key: name,
                                className: classNames(
                                    'tb-index__entry',
                                    model.activeAnchor === name && 'tb-index__entry--active'
                                ),
                                onClick: () => model.goTo(name),
                                children: pageTitle(name)
                            })
                        )
                    ]
                }),
                div({
                    ref: scrollRef,
                    className: 'tb-builtins__scroll',
                    onScroll: () => (model.activeAnchor = topAnchor(scrollRef.current)),
                    children: model.pages.map(page =>
                        div({
                            key: page.name,
                            ...anchorProps(ANCHORS, page.name),
                            className: 'tb-builtins__section',
                            children: builtinBody({model: page})
                        })
                    )
                })
            ]
        });
    }
});

const builtinBody = hoistCmp.factory<BuiltinPageModel>({
    model: uses(BuiltinPageModel),

    render({model}) {
        const {name, spec, role, blueprintModel} = model,
            concept = CONCEPT_PAGES.find(it => it.id === role.concept);
        return wrapper({
            title: pageTitle(name),
            icon: Icon.cube(),
            description: spec ? describe(spec, role) : INPUTS_INTRO,
            options: [
                ...Object.entries(groupBy(model.settings, it => it.section)).map(
                    ([section, settings]) =>
                        wrapperOptionGroup({
                            key: section,
                            label: section,
                            info: section === 'Children' ? 'Applies to every child.' : null,
                            children: settings.map(setting =>
                                wrapperOption({
                                    key: setting.key,
                                    label: setting.label,
                                    control: settingControl(model, setting)
                                })
                            )
                        })
                ),
                blueprintModel
                    ? wrapperAction({
                          text: 'Reset example',
                          icon: Icon.reset(),
                          onClick: () => model.reset()
                      })
                    : null,
                spec
                    ? wrapperAction({
                          text: 'Open in Registry',
                          icon: Icon.list(),
                          onClick: () =>
                              XH.navigate('default.blueprints.portfolioRegistry', {
                                  entry: `widget:${name}`
                              })
                      })
                    : null,
                concept
                    ? wrapperAction({
                          text: `Concept: ${concept.title}`,
                          icon: Icon.book(),
                          onClick: () => XH.navigate(`default.blueprints.concept-${concept.id}`)
                      })
                    : null
            ].filter(Boolean),
            children: panel({
                className: 'tb-blueprints-island',
                title: ISLAND_TITLES[name] ?? 'Example',
                icon: Icon.play(),
                compactHeader: true,
                width: '100%',
                height: '100%',
                mask: model.loadObserver,
                children: blueprintModel
                    ? blueprintView({model: blueprintModel})
                    : placeholder(model.loadObserver.isPending ? 'Loading...' : 'No example.')
            })
        });
    }
});

//------------------
// Implementation
//------------------
const ISLAND_TITLES: Record<string, string> = {
    dashboard: 'Example: drag a header to move a cell',
    [INPUTS_OVERVIEW]: 'Each input, bound to a variable'
};

const INPUTS_INTRO = [
    'Every input sets a variable, which sources, filters and other widgets read. Each input here is bound to its own variable, labelled from the variable, with its live value under it.',
    '',
    'Pick a value to see the variable change. Each input below has its own settings.'
];

function pageTitle(name: string): string {
    return name === INPUTS_OVERVIEW ? 'All inputs' : name;
}

// The widget's summary, then its facts as a list.
function describe(spec: WidgetSpec, role: BuiltinRole): string[] {
    const children = spec.children,
        perChild = Object.keys(children?.schema?.properties ?? {}).filter(it => it !== 'id'),
        size = spec.size?.default,
        facts: [string, string][] = [
            ['Role', role.title],
            ['Children', children ? acceptsText(children.accepts) : null],
            ['Slots', Object.keys(children?.slots ?? {}).join(', ')],
            ['Per child', perChild.join(', ')],
            ['Presets set', spec.presetPaths?.join(', ')],
            ['Outputs', spec.outputs?.map(it => `${it.name} (${it.type})`).join(', ')],
            ['Default size', size ? `${size.w}×${size.h}` : null]
        ];
    return [
        spec.description ?? spec.summary ?? '',
        '',
        ...facts.filter(([, v]) => v).map(([k, v]) => `- **${k}**: \`${v}\``)
    ];
}

function acceptsText(accepts: {categories?: string[]; widgets?: string[]}): string {
    const parts = [...(accepts?.categories ?? []), ...(accepts?.widgets ?? [])];
    return parts.length ? parts.join(', ') : 'any widget';
}

function settingControl(model: BuiltinPageModel, setting: BuiltinSetting) {
    const value = model.settingValue(setting),
        onChange = (v: unknown) => model.set(setting, v);
    switch (setting.kind) {
        case 'bool':
            return segmentedControl({
                value: !!value,
                toggleOnClick: true,
                intent: 'primary',
                options: setting.boolOptions,
                onChange
            });
        case 'intent':
            return intentInput({
                value: value === 'none' ? null : (value as any),
                enableClear: true,
                onChange: v => onChange(v ?? undefined)
            });
        case 'number':
            return numberInput({
                value: value as number,
                min: setting.key === 'columns' ? model.minColumns : setting.min,
                max: setting.max,
                placeholder: 'Default',
                width: 90,
                onCommit: onChange
            });
        default: {
            const options = setting.options.map(it => ({
                value: it as any,
                label: it === false ? 'Off' : upperFirst(String(it))
            }));
            if (setting.thumbnails) {
                return radioCardInput({
                    value: value as any,
                    cardWidth: 76,
                    options: options.map(it => ({
                        ...it,
                        preview: thumbnailPreview(setting.thumbnails[String(it.value)])
                    })),
                    onChange
                });
            }
            return options.length <= 4
                ? segmentedControl({value: value as any, intent: 'primary', options, onChange})
                : select({value: value as any, options, width: 140, onChange});
        }
    }
}
