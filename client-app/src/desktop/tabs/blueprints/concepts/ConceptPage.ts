import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintDesignModel, BlueprintModel} from '@xh/hoist-chat-kit/blueprint';
import {blueprintMap, blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {div, filler, hbox, p, placeholder, pre, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, uses, XH} from '@xh/hoist/core';
import type {ElementFactory, LoadSpec} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput, segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, observableRef, runInAction} from '@xh/hoist/mobx';
import {PORTFOLIO_TYPE} from '../../../../blueprints/blueprintTypes';
import {md} from '../../../../blueprints/markdown';
import {createRepository} from '../../../../blueprints/repository/createRepository';
import {ServerDataProvider} from '../../../../blueprints/ServerDataProvider';
import {portfolioCatalogAsync} from '../portfolioCatalog';
import {CONCEPT_PAGES} from './conceptPages';
import type {ConceptPage} from './conceptPages';

/** A Concepts page's live example: the blueprint, read-only in run mode, with its JSON and Map. */
class ConceptPageModel extends HoistModel {
    @bindable accessor view: 'example' | 'json' | 'map' = 'example';
    @observableRef accessor blueprintModel: BlueprintModel = null;
    @observableRef accessor designModel: BlueprintDesignModel = null;

    readonly page: ConceptPage;

    constructor(page: ConceptPage) {
        super();
        this.page = page;
    }

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {example} = this.page;
        if (!example || this.blueprintModel) return;
        const catalog = await portfolioCatalogAsync();
        if (loadSpec.isStale) return;
        const blueprintModel = this.markManaged(
            new BlueprintModel({
                catalog,
                registry: PORTFOLIO_TYPE.createRegistry(),
                dataProvider: new ServerDataProvider(),
                mode: 'run',
                access: 'read'
            })
        );
        // An openBlueprint action opens its target through a repository, as in the editor.
        blueprintModel.drillInRepository = createRepository(PORTFOLIO_TYPE.name);
        blueprintModel.setBlueprint(example as Blueprint);
        runInAction(() => {
            this.blueprintModel = blueprintModel;
            this.designModel = this.markManaged(new BlueprintDesignModel({blueprintModel}));
        });
    }
}

/**
 * One Concepts page's content: its copy, its live example with JSON and Map, and a link to the
 * next page. Each page has its own factory, which creates the page's model.
 */
export function conceptPageContent(page: ConceptPage): ElementFactory {
    let ret = factories.get(page.id);
    if (!ret) {
        ret = hoistCmp.factory({
            displayName: 'BlueprintsConceptPage',
            model: creates(() => new ConceptPageModel(page)),
            render: () => conceptBody()
        });
        factories.set(page.id, ret);
    }
    return ret;
}

const factories = new Map<string, ElementFactory>();

const conceptBody = hoistCmp.factory<ConceptPageModel>({
    model: uses(ConceptPageModel),

    render({model}) {
        const {page} = model,
            idx = CONCEPT_PAGES.indexOf(page),
            next = CONCEPT_PAGES[idx + 1];
        return panel({
            className: 'tb-concept',
            scrollable: true,
            children: vbox({
                className: 'tb-concept__body',
                children: [
                    div({className: 'tb-concept__title', children: page.title}),
                    ...page.paragraphs.map((it, i) =>
                        div({key: i, className: 'tb-concept__para', children: md(it)})
                    ),
                    page.code ? pre({className: 'tb-concept__code', children: page.code}) : null,
                    page.example ? exampleFrame() : architectLink(),
                    hbox({
                        className: 'tb-concept__nav',
                        children: [
                            filler(),
                            next
                                ? button({
                                      text: `Next: ${next.title}`,
                                      rightIcon: Icon.chevronRight(),
                                      minimal: false,
                                      onClick: () =>
                                          XH.navigate(`default.blueprints.concept-${next.id}`)
                                  })
                                : null
                        ]
                    })
                ]
            })
        });
    }
});

const exampleFrame = hoistCmp.factory<ConceptPageModel>({
    model: uses(ConceptPageModel),
    render: ({model}) => {
        const {blueprintModel, designModel, view} = model;
        return panel({
            className: 'tb-concept__example',
            tbar: [
                segmentedControl({
                    bind: 'view',
                    compact: true,
                    options: [
                        {value: 'example', label: 'Live example', icon: Icon.play()},
                        {value: 'json', label: 'JSON', icon: Icon.code()},
                        {value: 'map', label: 'Map', icon: Icon.treeList()}
                    ]
                })
            ],
            mask: model.loadObserver,
            children: !blueprintModel
                ? placeholder('Loading the example...')
                : view === 'json'
                  ? jsonInput({
                        value: JSON.stringify(model.page.example, null, 2),
                        readonly: true,
                        flex: 1,
                        width: '100%'
                    })
                  : view === 'map'
                    ? blueprintMap({designModel})
                    : blueprintView({model: blueprintModel})
        });
    }
});

const architectLink = hoistCmp.factory(() =>
    p({
        className: 'tb-concept__para',
        children: button({
            text: 'Open the Portfolio example',
            icon: Icon.ai(),
            intent: 'primary',
            minimal: false,
            onClick: () => XH.navigate('default.blueprints.portfolio')
        })
    })
);
