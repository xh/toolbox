import type {
    Blueprint,
    BlueprintElement,
    BlueprintRegistry,
    WidgetSpec
} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintModel} from '@xh/hoist-chat-kit/blueprint';
import {blueprintView, thumbnailPreview} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {placeholder} from '@xh/hoist/cmp/layout';
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
import {action, observableRef, runInAction} from '@xh/hoist/mobx';
import {groupBy, upperFirst} from 'lodash';
import {PORTFOLIO_TYPE} from '../../../../blueprints/blueprintTypes';
import {createRepository} from '../../../../blueprints/repository/createRepository';
import {ServerDataProvider} from '../../../../blueprints/ServerDataProvider';
import {wrapper, wrapperAction, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {CONCEPT_PAGES} from '../concepts/conceptPages';
import {portfolioCatalogAsync} from '../portfolioCatalog';
import {builtinExample, INPUTS_OVERVIEW} from './builtinExamples';
import type {BuiltinRole} from './builtinRoles';
import {builtinSettings} from './builtinSettings';
import type {BuiltinSetting} from './builtinSettings';

/** A Built-ins page: one widget, or every input at once, live, with its main settings to try. */
class BuiltinPageModel extends HoistModel {
    readonly registry: BlueprintRegistry = PORTFOLIO_TYPE.createRegistry();
    readonly spec: WidgetSpec;
    readonly settings: BuiltinSetting[];

    @observableRef accessor blueprintModel: BlueprintModel = null;
    @observableRef accessor blueprint: Blueprint = null;
    private original: Blueprint = null;

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
        const model = this.markManaged(
            new BlueprintModel({
                catalog,
                registry: this.registry,
                dataProvider: new ServerDataProvider(),
                mode: 'run',
                access: 'read'
            })
        );
        model.drillInRepository = createRepository(PORTFOLIO_TYPE.name);
        model.setBlueprint(blueprint);
        this.original = blueprint;
        runInAction(() => {
            this.blueprintModel = model;
            this.blueprint = blueprint;
        });
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
            next = setting.perChild
                ? {
                      ...root,
                      children: root.children.map((it: PlainObject) => ({
                          ...it,
                          [setting.key]: value
                      }))
                  }
                : {...root, config: {...root.config, [setting.key]: value}};
        this.apply({
            ...blueprint,
            elements: {...blueprint.elements, [blueprint.root]: next as BlueprintElement}
        });
    }

    @action
    reset() {
        this.apply(this.original);
    }

    private get root(): PlainObject {
        return this.blueprint?.elements[this.blueprint.root];
    }

    private apply(blueprint: Blueprint) {
        this.blueprint = blueprint;
        this.blueprintModel.setBlueprint(blueprint);
    }
}

/** A Built-ins page's content. Each page has its own factory, which creates the page's model. */
export function builtinPageContent(name: string, role: BuiltinRole): ElementFactory {
    let ret = factories.get(name);
    if (!ret) {
        ret = hoistCmp.factory({
            displayName: 'BlueprintsBuiltinPage',
            model: creates(() => new BuiltinPageModel(name, role)),
            render: () => builtinBody()
        });
        factories.set(name, ret);
    }
    return ret;
}

const factories = new Map<string, ElementFactory>();

const builtinBody = hoistCmp.factory<BuiltinPageModel>({
    model: uses(BuiltinPageModel),

    render({model}) {
        const {name, spec, role, blueprintModel} = model,
            concept = CONCEPT_PAGES.find(it => it.id === role.concept);
        return wrapper({
            title: name === INPUTS_OVERVIEW ? 'All inputs' : name,
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
    dashCanvas: 'Example: drag a header to move a cell',
    [INPUTS_OVERVIEW]: 'Each input, bound to a variable'
};

const INPUTS_INTRO = [
    'Every input sets a variable, which sources, filters and other widgets read. Each input here is bound to its own variable, labelled from the variable, with its live value under it.',
    '',
    "Pick a value to see the variable change. Each input's own page has its settings."
];

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
                min: setting.min,
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
