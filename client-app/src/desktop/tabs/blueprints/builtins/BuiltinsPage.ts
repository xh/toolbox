import type {BlueprintRegistry, WidgetSpec} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintModel, exampleBlueprintOf} from '@xh/hoist-chat-kit/blueprint';
import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {div, filler, hbox, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, uses, XH} from '@xh/hoist/core';
import type {ElementFactory, HoistProps, LoadSpec, PlainObject} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {observableRef, runInAction} from '@xh/hoist/mobx';
import {PORTFOLIO_TYPE} from '../../../../blueprints/blueprintTypes';
import {md} from '../../../../blueprints/markdown';
import {createRepository} from '../../../../blueprints/repository/createRepository';
import {ServerDataProvider} from '../../../../blueprints/ServerDataProvider';
import {portfolioCatalogAsync} from '../portfolioCatalog';
import {roleWidgets} from './builtinRoles';
import type {BuiltinRole} from './builtinRoles';

/** A Built-ins page: each widget of its role, with its live example, read-only in run mode. */
class BuiltinsPageModel extends HoistModel {
    readonly role: BuiltinRole;
    readonly registry: BlueprintRegistry = PORTFOLIO_TYPE.createRegistry();
    readonly builtIn: string[];
    readonly app: string[];

    /** Each widget's example, by widget name, once the catalog loads. */
    @observableRef accessor examples: Record<string, BlueprintModel> = null;

    constructor(role: BuiltinRole) {
        super();
        this.role = role;
        ({builtIn: this.builtIn, app: this.app} = roleWidgets(this.registry, role));
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        if (this.examples) return;
        const catalog = await portfolioCatalogAsync();
        if (loadSpec.isStale) return;
        const {registry} = this,
            dataProvider = new ServerDataProvider(),
            repository = createRepository(PORTFOLIO_TYPE.name),
            examples = {};
        [...this.builtIn, ...this.app].forEach(name => {
            const {blueprint} = exampleBlueprintOf({...registry.widgets[name], name}, catalog);
            if (!blueprint) return;
            const model = this.markManaged(
                new BlueprintModel({catalog, registry, dataProvider, mode: 'run', access: 'read'})
            );
            model.drillInRepository = repository;
            model.setBlueprint(blueprint);
            examples[name] = model;
        });
        runInAction(() => (this.examples = examples));
    }
}

/** A Built-ins page's content. Each role has its own factory, which creates the page's model. */
export function builtinsPageContent(role: BuiltinRole): ElementFactory {
    let ret = factories.get(role.key);
    if (!ret) {
        ret = hoistCmp.factory({
            displayName: 'BlueprintsBuiltinsPage',
            model: creates(() => new BuiltinsPageModel(role)),
            render: () => builtinsBody()
        });
        factories.set(role.key, ret);
    }
    return ret;
}

const factories = new Map<string, ElementFactory>();

const builtinsBody = hoistCmp.factory<BuiltinsPageModel>({
    model: uses(BuiltinsPageModel),
    render({model}) {
        const {role, builtIn, app} = model;
        return panel({
            className: 'tb-builtins',
            scrollable: true,
            mask: model.loadObserver,
            children: vbox({
                className: 'tb-builtins__body',
                children: [
                    div({className: 'tb-concept__title', children: role.title}),
                    div({className: 'tb-concept__para', children: role.description}),
                    ...builtIn.map(name => widgetSection({name, key: name})),
                    app.length
                        ? div({className: 'tb-builtins__group', children: 'From this app'})
                        : null,
                    ...app.map(name => widgetSection({name, key: name}))
                ]
            })
        });
    }
});

interface WidgetSectionProps extends HoistProps<BuiltinsPageModel> {
    name: string;
}

const widgetSection = hoistCmp.factory<WidgetSectionProps>({
    model: uses(BuiltinsPageModel),
    render({model, name}) {
        const spec = model.registry.widgets[name] as WidgetSpec & PlainObject,
            example = model.examples?.[name],
            summary = (spec.description ?? spec.guidance ?? '').split('\n')[0];
        return vbox({
            className: 'tb-builtins__widget',
            children: [
                hbox({
                    className: 'tb-builtins__head',
                    children: [
                        span({className: 'tb-builtins__name', children: name}),
                        spec.label ? span({className: 'tb-muted', children: spec.label}) : null,
                        filler(),
                        button({
                            text: 'Open in Registry',
                            icon: Icon.list(),
                            onClick: () =>
                                XH.navigate('default.blueprints.portfolioRegistry', {
                                    entry: `widget:${name}`
                                })
                        })
                    ]
                }),
                summary ? div({className: 'tb-concept__para', children: md(summary)}) : null,
                div({
                    className: 'tb-builtins__example',
                    style: {height: exampleHeight(spec)},
                    children: example
                        ? blueprintView({model: example})
                        : placeholder(model.examples ? 'No example.' : 'Loading...')
                }),
                facts(spec)
            ]
        });
    }
});

//------------------
// Implementation
//------------------
function facts(spec: PlainObject) {
    const fmt = (s: PlainObject) => (s ? `${s.w}×${s.h}` : null),
        rows: [string, string][] = [
            ['Outputs', spec.outputs?.map((o: PlainObject) => `${o.name} (${o.type})`).join(', ')],
            ['Presets', spec.presetPaths?.join(', ')],
            [
                'Sizes',
                spec.size
                    ? [
                          `default ${fmt(spec.size.default)}`,
                          spec.size.min ? `min ${fmt(spec.size.min)}` : null
                      ]
                          .filter(Boolean)
                          .join(', ')
                    : null
            ]
        ];
    return div({
        className: 'tb-catalog-detail__facts tb-builtins__facts',
        children: rows
            .filter(([, v]) => v)
            .flatMap(([label, value]) => [
                span({
                    key: `${label}-k`,
                    className: 'tb-catalog-detail__fact-label',
                    children: label
                }),
                span({key: `${label}-v`, className: 'tb-mono', children: value})
            ])
    });
}

// Room for an example: its default size on a canvas, within bounds.
function exampleHeight(spec: PlainObject): number {
    const rows = spec.size?.default?.h ?? 4;
    return Math.min(Math.max(rows * 50, 120), 420);
}
