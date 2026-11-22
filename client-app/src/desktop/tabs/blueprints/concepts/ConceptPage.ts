import type {Blueprint} from '@xh/hoist-chat-kit/blueprint';
import {BlueprintDesignModel, BlueprintModel} from '@xh/hoist-chat-kit/blueprint';
import {blueprintMap, blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, uses, XH} from '@xh/hoist/core';
import type {ElementFactory, LoadSpec} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {jsonInput, segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable, observableRef, runInAction} from '@xh/hoist/mobx';
import {PORTFOLIO_TYPE} from '../../../../blueprints/blueprintTypes';
import {createRepository} from '../../../../blueprints/repository/createRepository';
import {ServerDataProvider} from '../../../../blueprints/ServerDataProvider';
import {wrapper, wrapperAction, wrapperOption} from '../../../common/Wrapper';
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
            next = CONCEPT_PAGES[CONCEPT_PAGES.indexOf(page) + 1];
        return wrapper({
            title: page.title,
            icon: Icon.book(),
            description: [
                ...page.paragraphs.flatMap(it => [it, '']),
                ...(page.code ? ['```json', page.code, '```'] : [])
            ],
            options: [
                page.example
                    ? wrapperOption({
                          label: 'Show',
                          control: segmentedControl({
                              model,
                              bind: 'view',
                              options: [
                                  {value: 'example', label: 'Example'},
                                  {value: 'json', label: 'JSON'},
                                  {value: 'map', label: 'Map'}
                              ]
                          })
                      })
                    : null,
                next
                    ? wrapperAction({
                          text: `Next: ${next.title}`,
                          icon: Icon.chevronRight(),
                          onClick: () => XH.navigate(`default.blueprints.concept-${next.id}`)
                      })
                    : null
            ].filter(Boolean),
            children: panel({
                className: 'tb-blueprints-island',
                title: VIEW_TITLES[model.view],
                icon: Icon.play(),
                compactHeader: true,
                width: '100%',
                height: '100%',
                mask: model.loadObserver,
                children: page.example ? exampleBody() : architectLink()
            })
        });
    }
});

const VIEW_TITLES = {example: 'Example', json: 'JSON', map: 'Map'};

const exampleBody = hoistCmp.factory<ConceptPageModel>({
    model: uses(ConceptPageModel),
    render: ({model}) => {
        const {blueprintModel, designModel, view} = model;
        if (!blueprintModel) return placeholder('Loading the example...');
        switch (view) {
            case 'json':
                return jsonInput({
                    value: JSON.stringify(model.page.example, null, 2),
                    readonly: true,
                    flex: 1,
                    width: '100%'
                });
            case 'map':
                return blueprintMap({designModel});
            default:
                return blueprintView({model: blueprintModel});
        }
    }
});

const architectLink = hoistCmp.factory(() =>
    placeholder(
        button({
            text: 'Open the Portfolio example',
            icon: Icon.ai(),
            intent: 'primary',
            minimal: false,
            onClick: () => XH.navigate('default.blueprints.portfolio')
        })
    )
);
