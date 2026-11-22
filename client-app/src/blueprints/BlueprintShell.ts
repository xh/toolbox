import type {Blueprint, BlueprintRegistry} from '@xh/hoist-chat-kit/blueprint';
import {blueprintSchematic} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {grid} from '@xh/hoist/cmp/grid';
import {div, filler, hbox, span} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {TabContainerModel, tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, lookup, managed, uses} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import type {StoreRecord} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import type {KeyboardEvent as ReactKeyboardEvent, ReactNode} from 'react';
import {showBlueprintsHelp} from './blueprintsHelp';
import './Blueprints.scss';
import {BlueprintShellModel} from './BlueprintShellModel';
import type {DesignerView} from './BlueprintShellModel';
import {catalogPanel} from './catalog/CatalogPanel';
import {editor} from './editor/Editor';
import {LIBRARY_GROUPS, libraryStatus} from './libraryColumns';
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
                omit: model.shell.maximize === 'fill' && !model.shell.libraryOpen,
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
                        segmentedControl({
                            bind: 'libraryView',
                            compact: true,
                            options: [
                                {value: 'list', label: 'List', icon: Icon.list()},
                                {value: 'cards', label: 'Cards', icon: Icon.gridLarge()}
                            ]
                        }),
                        newMenu()
                    ]
                }),
                model.libraryView === 'cards' ? libraryCards() : libraryList()
            ]
        })
});

/** The library as a grid, grouped Yours, Shared with you and Examples. */
const libraryList = hoistCmp.factory<BlueprintShellModel>({
    model: uses(BlueprintShellModel),
    render: ({model}) =>
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
});

/**
 * The library as cards, each with a schematic of its blueprint, grouped as the list is and
 * filtered by the same search.
 */
const libraryCards = hoistCmp.factory<BlueprintShellModel>({
    model: uses(BlueprintShellModel),
    render: ({model}) => {
        const records = model.listGridModel.store.records,
            registry = model.blueprintModel.registry as BlueprintRegistry;
        return div({
            className: 'tb-library__cards',
            children: LIBRARY_GROUPS.map(group => {
                const rows = records.filter(it => it.data.group === group),
                    real = rows.filter(it => !it.data.placeholder);
                if (!rows.length) return null;
                return div({
                    key: group,
                    className: 'tb-library__card-group',
                    children: [
                        div({
                            className: 'tb-library__card-group-title',
                            children: `${group} (${real.length})`
                        }),
                        real.length
                            ? div({
                                  className: 'tb-library__card-grid',
                                  children: real.map(rec =>
                                      blueprintCard({
                                          key: rec.id,
                                          record: rec,
                                          blueprint: model.previews[rec.id as string]?.blueprint,
                                          registry
                                      })
                                  )
                              })
                            : div({
                                  className: 'tb-library__card-hint',
                                  children: rows[0].data.name
                              })
                    ]
                });
            })
        });
    }
});

interface BlueprintCardProps extends HoistProps<BlueprintShellModel> {
    record: StoreRecord;
    blueprint: Blueprint;
    registry: BlueprintRegistry;
}

const blueprintCard = hoistCmp.factory<BlueprintCardProps>({
    model: uses(BlueprintShellModel),
    render: ({model, record, blueprint, registry}) => {
        const {id, data} = record,
            open = () => model.selectAsync(id as string);
        return div({
            className: 'tb-bpcard',
            role: 'button',
            tabIndex: 0,
            onClick: open,
            onKeyDown: (e: ReactKeyboardEvent) => {
                if (e.key === 'Enter') open();
            },
            children: [
                div({
                    className: 'tb-bpcard__preview',
                    children: blueprint ? blueprintSchematic(blueprint, registry) : null
                }),
                div({
                    className: 'tb-bpcard__text',
                    children: [
                        hbox({
                            className: 'tb-bpcard__head',
                            children: [
                                span({className: 'tb-bpcard__name', children: data.name}),
                                filler(),
                                button({
                                    icon: Icon.ellipsisHorizontal(),
                                    minimal: true,
                                    title: 'More',
                                    onClick: e => model.showRowMenu(record, e)
                                })
                            ]
                        }),
                        data.description
                            ? span({
                                  className: 'tb-bpcard__desc',
                                  children: (data.description as string).split('\n')[0]
                              })
                            : null,
                        libraryStatus(data)
                    ]
                })
            ]
        });
    }
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
