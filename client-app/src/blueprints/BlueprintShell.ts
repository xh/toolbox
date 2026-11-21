import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {grid} from '@xh/hoist/cmp/grid';
import {hbox, hframe, placeholder, span, vbox} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import classNames from 'classnames';
import {architectPanel} from './ArchitectPanel';
import {blueprintMenu} from './BlueprintMenu';
import './Blueprints.scss';
import type {BlueprintShellModel} from './BlueprintShellModel';
import {catalogPanel} from './catalog/CatalogPanel';
import {inspectorPanel} from './InspectorPanel';
import {registryPanel} from './registry/RegistryPanel';

/** The shell's library: a search, the blueprints the user may read, and New, Copy and Delete. */
export const blueprintLibrary = hoistCmp.factory<BlueprintShellModel>(({model}) =>
    vbox({
        className: 'tb-blueprints__library',
        items: [
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
                    libraryAction({
                        text: 'New',
                        icon: Icon.add(),
                        intent: 'primary',
                        disabled: !model.blueprintModel,
                        onClick: () => model.newBlueprintAsync()
                    }),
                    libraryAction({
                        text: 'Copy',
                        icon: Icon.copy(),
                        disabled: !model.documentModel?.document,
                        onClick: () => model.copySelectedAsync()
                    }),
                    libraryAction({
                        text: 'Delete',
                        icon: Icon.delete(),
                        disabled: model.selected?.access !== 'write',
                        onClick: () => model.deleteSelectedAsync()
                    })
                ]
            })
        ]
    })
);

/**
 * The shell's workspace: the Architect beside the open blueprint and its Inspector, or beside a
 * reference page. Renders nothing until the Data Catalog loads.
 */
export const blueprintWorkspace = hoistCmp.factory<BlueprintShellModel>(({model}) =>
    model.blueprintModel ? hframe(architectPanel(), mainPanel()) : null
);

const libraryAction = (props: Parameters<typeof button>[0]) =>
    button({minimal: false, flex: 1, ...props});

const mainPanel = hoistCmp.factory<BlueprintShellModel>(({model}) => {
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

    // A failed open leaves the previous blueprint in the model, which must not show under this title.
    const shown = blueprintModel.blueprint && !model.openIssues.some(it => it.severity === 'error');
    return hframe(
        panel({
            title: selected?.name ?? 'No blueprint',
            icon: Icon.layout(),
            compactHeader: true,
            headerItems: shown
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
            item: shown
                ? blueprintView({model: blueprintModel, designModel: model.designModel})
                : placeholder(Icon.layout(), emptyText(model))
        }),
        selected && shown ? inspectorPanel() : null
    );
});

function emptyText({selected, openIssues}: BlueprintShellModel): string {
    if (!selected) return 'Pick a blueprint, or start a new one.';
    const error = openIssues.find(it => it.severity === 'error');
    return error ? error.message : 'This blueprint is empty. Ask the Architect to build it.';
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
