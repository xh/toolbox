import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {box, br, frame, p, placeholder} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {DockContainerModel, dockContainer} from '@xh/hoist/desktop/cmp/dock';
import {sampleGrid, wrapper, wrapperAction} from '../../common';
import {errorWidget} from './widgets';

export const dockContainerPanel = hoistCmp.factory({
    model: creates(() => DockContainerPanelModel),

    render({model}) {
        const {viewCount} = model;
        return wrapper({
            title: 'Dock Container',
            icon: Icon.gridPanel(),
            description: [
                '`DockContainer` provides a user-friendly way to display multiple views',
                'simultaneously as docked overlays.',
                '',
                'Users can choose which views are expanded or collapsed at any given time, or',
                'if so enabled they can pop a view out of the dock and display it as a modal',
                'dialog.',
                '',
                'The states for docked views are based on the "compose" dialog within the',
                'ubiquitous Gmail web client, and docked views are generally intended for data',
                'entry forms, detail views, and other similar UI elements.',
                '',
                'Use the actions in the Options panel to add views to the container in this tab.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/DockContainerPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/dock/DockContainer.ts', notes: 'Hoist container component.'},
                {
                    url: '$HR/desktop/cmp/dock/DockContainerModel.ts',
                    notes: 'Hoist container model - primary API and configuration point for views.'
                },
                {
                    url: '$HR/desktop/cmp/dock/DockViewModel.ts',
                    notes: 'Hoist view model - created by DockContainerModel in its ctor from provided configs.'
                }
            ],
            options: [
                wrapperAction({
                    icon: Icon.add(),
                    text: 'Simple View',
                    onClick: () => model.addNewDockedView(true, true)
                }),
                wrapperAction({
                    icon: Icon.add(),
                    text: 'Complex View',
                    onClick: () => {
                        model.addView({
                            id: 'gridView',
                            title: 'A complex docked component',
                            icon: Icon.gridPanel(),
                            content: () =>
                                sampleGrid({omitGridTools: true, width: 500, height: 400}),
                            onClose: () =>
                                XH.toast({
                                    message: 'Thanks for checking out the view!',
                                    intent: 'success'
                                })
                        });
                    }
                }),
                wrapperAction({
                    icon: Icon.add(),
                    text: 'Error View',
                    onClick: () =>
                        model.addView({
                            id: 'errorView',
                            title: 'A problematic component',
                            icon: Icon.skull(),
                            content: () =>
                                errorWidget({
                                    componentName: 'DockContainer',
                                    width: 500,
                                    height: 400
                                }),
                            onClose: () =>
                                XH.confirm({
                                    message: 'Are you sure you want to close this view?',
                                    title: 'Close view?'
                                })
                        })
                }),
                wrapperAction({
                    icon: Icon.add(),
                    text: 'w/Dialog disabled',
                    onClick: () => model.addNewDockedView(false, true)
                }),
                wrapperAction({
                    icon: Icon.add(),
                    text: 'w/Close disabled',
                    onClick: () => model.addNewDockedView(true, false)
                })
            ],
            item: panel({
                height: '60vh',
                width: '90%',
                item: frame({
                    position: 'relative',
                    items: [
                        placeholder({
                            flex: 1,
                            items: [
                                Icon.gridPanel(),
                                p(
                                    viewCount
                                        ? `${viewCount} docked ${viewCount === 1 ? 'view' : 'views'}`
                                        : 'No docked views yet'
                                ),
                                p(
                                    viewCount
                                        ? 'Docked views appear along the bottom of this container.'
                                        : 'Add one from the Options panel to dock it along the bottom of this container.'
                                )
                            ]
                        }),
                        dockContainer()
                    ]
                })
            })
        });
    }
});

class DockContainerPanelModel extends HoistModel {
    @managed
    dockContainerModel = new DockContainerModel();

    get viewCount() {
        return this.dockContainerModel.views.length;
    }

    addView(cfg) {
        this.dockContainerModel.addView(cfg);
    }

    addNewDockedView(allowDialog, allowClose) {
        const textItems = ['You can add as many docked views as you want.', br(), br()];

        if (!allowDialog) {
            textItems.push('This view is configured so it cannot be expanded into a modal dialog.');
        }

        if (!allowClose) {
            textItems.push('This view is configured so it cannot be closed.');
        }

        this.addView({
            id: XH.genId(),
            icon: Icon.window(),
            title: 'A simple docked panel',
            width: 300,
            height: 150,
            collapsedWidth: 200,
            allowDialog,
            allowClose,
            content: () =>
                panel({
                    item: box({items: textItems, padding: 10})
                })
        });
    }
}
