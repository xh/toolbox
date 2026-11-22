import {grid} from '@xh/hoist/cmp/grid';
import {a, div, filler} from '@xh/hoist/cmp/layout';
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
import {showBlueprintsHelp} from './blueprintsHelp';
import './Blueprints.scss';
import {BlueprintShellModel} from './BlueprintShellModel';
import type {DesignerView} from './BlueprintShellModel';
import {catalogPanel} from './catalog/CatalogPanel';
import {editor} from './editor/Editor';
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
                children: [
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
            children: tabContainer({model: model.tabModel, switcher: false})
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
            children: [
                div({
                    className: 'tb-library__intro',
                    children: [
                        div({
                            className: 'tb-library__heading',
                            children: `${model.type.label} blueprints`
                        }),
                        div({
                            className: 'tb-library__lede',
                            children: [
                                `Dashboards described as JSON over the ${model.type.label.toLowerCase()} data, built by hand or with the Architect. Your drafts save as you work and stay private until you share them. `,
                                a({
                                    className: 'tb-library__help',
                                    onClick: () => showBlueprintsHelp(),
                                    children: 'How Blueprints work'
                                })
                            ]
                        })
                    ]
                }),
                toolbar({
                    className: 'tb-library__bar',
                    children: [
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
                            if (key === 'Enter' && e.data && !e.node.group && !e.data.placeholder)
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
            children: button({
                text: 'New',
                icon: Icon.add(),
                rightIcon: Icon.chevronDown(),
                intent: 'primary',
                minimal: false
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
                    onClick: () => model.newWithArchitectAsync()
                })
            )
        })
});
