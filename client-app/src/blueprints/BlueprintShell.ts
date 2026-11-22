import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hframe, placeholder, vframe} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {TabContainerModel, tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, lookup, managed, uses} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import type {ReactNode} from 'react';
import {architectPanel} from './ArchitectPanel';
import {showBlueprintsHelp} from './blueprintsHelp';
import './Blueprints.scss';
import {BlueprintShellModel} from './BlueprintShellModel';
import type {DesignerView} from './BlueprintShellModel';
import {catalogPanel} from './catalog/CatalogPanel';
import {documentBar} from './documentBar/DocumentBar';
import {inspectorPanel} from './InspectorPanel';
import {registryPanel} from './registry/RegistryPanel';

interface BlueprintShellViewProps extends HoistProps<BlueprintShellModel> {
    /** Items before the page tabs, such as a picker of blueprint types. */
    leadingItems?: ReactNode[];
}

/**
 * A blueprint app's shell: its pages (the library and open blueprint, the Data Catalog and the
 * Registry) under a row of page tabs. Renders nothing until the Data Catalog loads.
 */
export const blueprintShellView = hoistCmp.factory<BlueprintShellViewProps>({
    displayName: 'BlueprintShellView',
    model: uses(BlueprintShellModel),

    render({model, leadingItems = []}) {
        return model.blueprintModel ? pages({leadingItems}) : null;
    }
});

class PagesModel extends HoistModel {
    @lookup(BlueprintShellModel) shell: BlueprintShellModel;

    @managed tabModel = new TabContainerModel({
        tabs: [
            {
                id: 'blueprint',
                title: 'Blueprints',
                icon: Icon.layout(),
                content: () => blueprintPage()
            },
            {id: 'catalog', title: 'Data Catalog', icon: Icon.database(), content: catalogPanel},
            {id: 'registry', title: 'Registry', icon: Icon.list(), content: registryPanel}
        ]
    });

    override onLinked() {
        const {shell, tabModel} = this;
        this.addReaction(
            {
                track: () => shell.view,
                run: view => tabModel.activateTab(view),
                fireImmediately: true
            },
            {
                track: () => tabModel.activeTabId,
                run: id => (shell.view = id as DesignerView)
            }
        );
    }
}

interface PagesProps extends HoistProps<PagesModel> {
    leadingItems: ReactNode[];
}

const pages = hoistCmp.factory<PagesProps>({
    model: creates(PagesModel),
    render({model, leadingItems}) {
        return panel({
            className: 'tb-blueprints',
            tbar: toolbar({
                className: 'tb-blueprints__pagebar',
                items: [
                    ...leadingItems,
                    tabSwitcher({model: model.tabModel}),
                    filler(),
                    button({
                        icon: Icon.questionCircle(),
                        tooltip: 'How Blueprints work',
                        onClick: () => showBlueprintsHelp()
                    })
                ]
            }),
            item: tabContainer({model: model.tabModel, switcher: false})
        });
    }
});

/** The library, or the blueprint open. */
const blueprintPage = hoistCmp.factory<BlueprintShellModel>({
    model: uses(BlueprintShellModel),
    render: ({model}) => (model.libraryOpen ? libraryPage() : editor())
});

const libraryPage = hoistCmp.factory<BlueprintShellModel>({
    model: uses(BlueprintShellModel),
    render: ({model}) =>
        panel({
            className: 'tb-library',
            items: [
                div({
                    className: 'tb-library__intro',
                    items: [
                        div({
                            className: 'tb-library__heading',
                            item: `${model.type.label} blueprints`
                        }),
                        div({
                            className: 'tb-library__lede',
                            item: `Dashboards described as JSON over the ${model.type.label.toLowerCase()} data, built by hand or with the Architect. Your drafts save as you work and stay private until you share them.`
                        })
                    ]
                }),
                toolbar({
                    className: 'tb-library__bar',
                    items: [
                        storeFilterField({
                            gridModel: model.listGridModel,
                            includeFields: ['name', 'description', 'owner'],
                            placeholder: 'Search name, owner...',
                            width: 260
                        }),
                        filler(),
                        newMenu()
                    ]
                }),
                grid({
                    model: model.listGridModel,
                    agOptions: {
                        rowHeight: 44,
                        onCellKeyDown: e => {
                            const {key} = e.event as KeyboardEvent;
                            if (key === 'Enter' && e.data && !e.node.group)
                                model.selectAsync(e.data.id);
                        }
                    }
                })
            ]
        })
});

const newMenu = hoistCmp.factory<BlueprintShellModel>({
    model: uses(BlueprintShellModel),
    render: ({model}) =>
        popover({
            position: 'bottom-right',
            item: button({
                text: 'New',
                icon: Icon.add(),
                rightIcon: Icon.chevronDown(),
                intent: 'primary'
            }),
            content: menu(
                menuItem({
                    text: 'Empty dashboard',
                    icon: Icon.layout(),
                    onClick: () => model.newBlueprintAsync()
                }),
                menuItem({
                    text: 'From a Registry example',
                    icon: Icon.list(),
                    onClick: () => (model.view = 'registry')
                }),
                menuItem({
                    text: 'Ask the Architect',
                    icon: Icon.ai(),
                    onClick: () => model.newBlueprintAsync()
                })
            )
        })
});

/** The open blueprint: its bar over the Architect, the blueprint and, in design, its Inspector. */
const editor = hoistCmp.factory<BlueprintShellModel>({
    model: uses(BlueprintShellModel),
    render: () => vframe(documentBar(), hframe(architectPanel(), mainPanel()))
});

const mainPanel = hoistCmp.factory<BlueprintShellModel>({
    model: uses(BlueprintShellModel),
    render: ({model}) => {
        const {blueprintModel, selected} = model;
        // A failed open leaves the previous blueprint in the model, which must not show under this title.
        const shown =
            blueprintModel.blueprint && !model.openIssues.some(it => it.severity === 'error');
        return hframe(
            panel({
                item: shown
                    ? blueprintView({model: blueprintModel, designModel: model.designModel})
                    : placeholder(Icon.layout(), emptyText(model))
            }),
            selected && shown ? inspectorPanel() : null
        );
    }
});

function emptyText({selected, openIssues}: BlueprintShellModel): string {
    const error = openIssues.find(it => it.severity === 'error');
    if (error) return error.message;
    return selected
        ? 'This blueprint is empty. Ask the Architect to build it.'
        : 'Pick a blueprint, or start a new one.';
}
