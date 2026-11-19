import {blueprintView} from '@xh/hoist-chat-kit/desktop/cmp/blueprint';
import {grid} from '@xh/hoist/cmp/grid';
import {hbox, hframe, placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import type {HoistProps} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import type {ReactElement} from 'react';
import {wrapper, wrapperAction, wrapperOptionGroup} from '../../common/Wrapper';
import {architectPanel} from './ArchitectPanel';
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
                'the Architect to build or change it. Each keeps its own conversation, saved in',
                'local storage.'
            ],
            optionsLabel: null,
            options: [
                wrapperOptionGroup({
                    label: 'Blueprints',
                    icon: Icon.layout(),
                    children: [
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
                                    text: 'Delete',
                                    icon: Icon.delete(),
                                    disabled: !model.selected,
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
                }),
                wrapperAction({
                    text: 'Reset to presets',
                    icon: Icon.reset(),
                    intent: 'danger',
                    disabled: !blueprintModel,
                    onClick: () => model.resetLibraryAsync()
                })
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/blueprints/BlueprintsPanelModel.ts',
                    notes: 'The library, and the models that open a blueprint.'
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
            item: blueprintModel.blueprint
                ? blueprintView({model: blueprintModel})
                : placeholder(Icon.layout(), emptyText(model))
        }),
        selected ? inspectorPanel() : null
    );
});

function emptyText({selected}: BlueprintsPanelModel): string {
    if (!selected) return 'Pick a blueprint, or start a new one.';
    return selected.blueprint
        ? 'This blueprint has errors - see the Inspector.'
        : 'This blueprint is empty. Ask the Architect to build it.';
}
