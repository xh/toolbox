import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {grid} from '@xh/hoist/cmp/grid';
import {hbox, hframe, placeholder, span} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import type {ReactElement} from 'react';
import {wrapper, wrapperAction, wrapperOptionGroup} from '../../common/Wrapper';
import {architectPanel} from './ArchitectPanel';
import {blueprintMenu} from './BlueprintMenu';
import {BlueprintsPanelModel} from './BlueprintsPanelModel';
import type {DesignerView} from './BlueprintsPanelModel';
import './Blueprints.scss';
import {inspectorPanel} from './InspectorPanel';
import {catalogPanel} from './catalog/CatalogPanel';
import {registryPanel} from './registry/RegistryPanel';

/** The Blueprints Designer: a library of blueprints, each built with the Architect. */
export const blueprintsPanel = hoistCmp.factory({
    displayName: 'BlueprintsPanel',
    model: creates(BlueprintsPanelModel),

    render({model}) {
        const {blueprintModel} = model;
        return wrapper({
            title: 'Designer',
            icon: Icon.layout(),
            description: [
                'A blueprint describes a dashboard as JSON. Pick one, or start a new one, and ask',
                'the Architect to build or change it. Your own blueprints open as drafts, which save',
                'as you work, and are private until you share them. Others you share with see only',
                'your published versions: they run the latest, and may copy it to make it their own.',
                'Each blueprint keeps its own conversation with the Architect, in this browser.'
            ],
            optionsLabel: null,
            options: [
                wrapperOptionGroup({
                    label: 'Blueprints',
                    icon: Icon.layout(),
                    children: [
                        storeFilterField({
                            gridModel: model.listGridModel,
                            includeFields: ['name', 'description', 'owner'],
                            placeholder: 'Search blueprints...',
                            width: '100%'
                        }),
                        grid({
                            model: model.listGridModel,
                            className: 'tb-blueprints__list',
                            agOptions: {domLayout: 'autoHeight'}
                        }),
                        hbox({
                            className: 'tb-blueprints__list-actions',
                            items: [
                                wrapperAction({
                                    text: 'New',
                                    icon: Icon.add(),
                                    intent: 'primary',
                                    disabled: !blueprintModel,
                                    onClick: () => model.newBlueprintAsync()
                                }),
                                wrapperAction({
                                    text: 'Copy',
                                    icon: Icon.copy(),
                                    disabled: !model.documentModel?.document,
                                    onClick: () => model.copySelectedAsync()
                                }),
                                wrapperAction({
                                    text: 'Delete',
                                    icon: Icon.delete(),
                                    disabled: model.selected?.access !== 'write',
                                    onClick: () => model.deleteSelectedAsync()
                                })
                            ]
                        })
                    ]
                }),
                wrapperOptionGroup({
                    label: 'Reference',
                    icon: Icon.book(),
                    info: 'What blueprints are built from. Opens beside the Architect.',
                    children: [
                        viewButton({view: 'catalog', text: 'Data Catalog', icon: Icon.database()}),
                        viewButton({view: 'registry', text: 'Registry', icon: Icon.list()})
                    ]
                })
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/blueprints/BlueprintsPanelModel.ts',
                    notes: 'The library, and the models that open a blueprint.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/blueprints/repository/JsonBlobBlueprintRepository.ts',
                    notes: 'Where blueprints persist, on Hoist JsonBlobs.'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/blueprints/architectChat.ts',
                    notes: "The Architect's chat."
                },
                {url: '$CK/blueprint/README.md', text: 'Blueprints'}
            ],
            item: panel({
                flex: 1,
                width: '100%',
                mask: 'onLoad',
                item: blueprintModel ? hframe(architectPanel(), mainPanel()) : null
            })
        });
    }
});

interface ViewButtonProps extends HoistProps<BlueprintsPanelModel> {
    view: DesignerView;
    text: string;
    icon: ReactElement;
}

const viewButton = hoistCmp.factory<ViewButtonProps>(({model, view, text, icon}) =>
    wrapperAction({
        text,
        icon,
        active: model.view === view,
        disabled: !model.blueprintModel,
        onClick: () => model.toggleView(view)
    })
);

const mainPanel = hoistCmp.factory<BlueprintsPanelModel>(({model}) => {
    const {view, blueprintModel, selected} = model;
    if (view !== 'blueprint') {
        const isCatalog = view === 'catalog';
        return panel({
            title: isCatalog ? 'Data Catalog' : 'Registry',
            icon: isCatalog ? Icon.database() : Icon.list(),
            compactHeader: true,
            headerItems: [
                button({
                    icon: Icon.close(),
                    tooltip: 'Back to the blueprint',
                    onClick: () => model.toggleView(view)
                })
            ],
            item: isCatalog ? catalogPanel() : registryPanel()
        });
    }

    return hframe(
        panel({
            title: selected?.name ?? 'No blueprint',
            icon: Icon.layout(),
            compactHeader: true,
            headerItems: blueprintModel.blueprint
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
                : [],
            item: blueprintModel.blueprint
                ? blueprintView({model: blueprintModel, designModel: model.designModel})
                : placeholder(Icon.layout(), emptyText(model))
        }),
        selected ? inspectorPanel() : null
    );
});

function emptyText({selected, openIssues}: BlueprintsPanelModel): string {
    if (!selected) return 'Pick a blueprint, or start a new one.';
    const error = openIssues.find(it => it.severity === 'error');
    return error ? error.message : 'This blueprint is empty. Ask the Architect to build it.';
}

/** Which version is open, and whether its edits are saved. */
function documentStatus({documentModel, isSaving, saveIssues}: BlueprintsPanelModel): string {
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
