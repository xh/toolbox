import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {grid} from '@xh/hoist/cmp/grid';
import {a, div, filler, hframe, li, p, placeholder, span, ul, vbox} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {TabContainerModel, tabContainer} from '@xh/hoist/cmp/tab';
import {creates, hoistCmp, HoistModel, lookup, managed, uses, XH} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {tabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import classNames from 'classnames';
import type {ReactNode} from 'react';
import {architectPanel} from './ArchitectPanel';
import {blueprintMenu} from './BlueprintMenu';
import './Blueprints.scss';
import {BlueprintShellModel} from './BlueprintShellModel';
import type {DesignerView} from './BlueprintShellModel';
import {catalogPanel} from './catalog/CatalogPanel';
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
const blueprintPage = hoistCmp.factory<BlueprintShellModel>(({model}) =>
    model.libraryOpen ? libraryPage() : editor()
);

const libraryPage = hoistCmp.factory<BlueprintShellModel>(({model}) =>
    panel({
        className: 'tb-library',
        items: [
            div({
                className: 'tb-library__intro',
                items: [
                    div({className: 'tb-library__heading', item: `${model.type.label} blueprints`}),
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
);

const newMenu = hoistCmp.factory<BlueprintShellModel>(({model}) =>
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
);

/** The open blueprint: the Architect beside it, and its Inspector in design. */
const editor = hoistCmp.factory<BlueprintShellModel>(() => hframe(architectPanel(), mainPanel()));

const mainPanel = hoistCmp.factory<BlueprintShellModel>(({model}) => {
    const {blueprintModel, selected} = model;
    // A failed open leaves the previous blueprint in the model, which must not show under this title.
    const shown = blueprintModel.blueprint && !model.openIssues.some(it => it.severity === 'error');
    return hframe(
        panel({
            title: selected?.name ?? 'No blueprint',
            icon: Icon.layout(),
            compactHeader: true,
            headerItems: [
                button({
                    text: 'Library',
                    icon: Icon.chevronLeft(),
                    onClick: () => model.showLibraryAsync()
                }),
                ...(shown
                    ? [
                          span({
                              className: classNames(
                                  'tb-blueprints__version',
                                  model.documentModel.isStale && 'xh-intent-warning'
                              ),
                              title: model.documentModel.isStale
                                  ? 'Saved elsewhere since you opened it, so your edits here are not saved. From the menu, Reload to take the saved draft, or Save as new to keep yours.'
                                  : null,
                              item: documentStatus(model)
                          }),
                          button({
                              text: 'Publish',
                              icon: Icon.upload(),
                              omit:
                                  !model.canEdit ||
                                  !model.documentModel.canPublish ||
                                  model.documentModel.isStale,
                              onClick: () => model.publishSelectedAsync()
                          }),
                          segmentedControl({
                              omit: !model.canEdit,
                              value: blueprintModel.mode,
                              onChange: mode => blueprintModel.setMode(mode),
                              compact: true,
                              options: [
                                  {value: 'design', label: 'Design', icon: Icon.edit()},
                                  {value: 'run', label: 'Run', icon: Icon.play()}
                              ]
                          }),
                          blueprintMenu()
                      ]
                    : [])
            ],
            item: shown
                ? blueprintView({model: blueprintModel, designModel: model.designModel})
                : placeholder(Icon.layout(), emptyText(model))
        }),
        selected && shown ? inspectorPanel() : null
    );
});

function emptyText({selected, openIssues}: BlueprintShellModel): string {
    const error = openIssues.find(it => it.severity === 'error');
    if (error) return error.message;
    return selected
        ? 'This blueprint is empty. Ask the Architect to build it.'
        : 'Pick a blueprint, or start a new one.';
}

/** Which version is open, and whether its edits are saved. */
function documentStatus({documentModel, isSaving, saveIssues}: BlueprintShellModel): string {
    const doc = documentModel.document;
    if (!doc) return null;
    if (doc.kind === 'publish') {
        return `Publish v${doc.version}${doc.access === 'write' ? '' : ' - read only'}`;
    }
    if (documentModel.isStale) return 'Not saved - changed elsewhere';
    const error = saveIssues[0];
    if (error) return error.message;
    if (isSaving) return 'Saving...';
    return documentModel.isDirty ? `Draft v${doc.version} - unsaved` : `Draft v${doc.version}`;
}

/** The "How Blueprints work" dialog: the concepts, and where to read more. */
export function showBlueprintsHelp() {
    XH.alert({
        title: 'How Blueprints work',
        icon: Icon.questionCircle(),
        message: vbox({
            className: 'tb-blueprints-help',
            items: [
                p(
                    'A blueprint describes a dashboard as JSON: its widgets and layout, the data sources they read, and the variables that link them. Pick one in the library, or start a new one, and build or change it by hand or by asking the Architect.'
                ),
                p(
                    'Your own blueprints open as drafts, which save as you work and are private until you share them. Others you share with see only your published versions: they run the latest, and may copy it to make it their own. Each blueprint keeps its own conversation with the Architect, in this browser.'
                ),
                p(
                    'Data Catalog lists the data a blueprint can read, and Registry the widgets it can draw.'
                ),
                ul(
                    li(
                        a({
                            href: '/app/docs/hoist-chat-kit/blueprint~README.md',
                            target: '_blank',
                            item: 'Blueprints, in the docs'
                        })
                    ),
                    li(
                        a({
                            href: 'https://github.com/xh/toolbox/tree/develop/client-app/src/blueprints',
                            target: '_blank',
                            item: "Toolbox's blueprint code"
                        })
                    )
                )
            ]
        })
    });
}
