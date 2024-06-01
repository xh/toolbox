import React from 'react';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {box, br, hbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {DockContainerModel, dockContainer} from '@xh/hoist/desktop/cmp/dock';
import {sampleGrid, wrapper} from '../../common';
import {errorWidget} from './widgets';

export const dockContainerPanel = hoistCmp.factory({
    model: creates(() => DockContainerPanelModel),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    <code>DockContainer</code> provides a user-friendly way to display multiple
                    views simultaneously as docked overlays.
                </p>,
                <p>
                    Users can choose which views are expanded or collapsed at any given time, or if
                    so enabled they can pop a view out of the dock and display it as a modal dialog.
                </p>,
                <p>
                    The states for docked views are based on the "compose" dialog within the
                    ubiquitous Gmail web client, and docked views are generally intended for data
                    entry forms, detail views, and other similar UI elements.
                </p>,
                <p>Use the buttons below to test adding views to a container within this tab.</p>
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/DockContainerPanel.tsx',
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
            items: [
                hbox({
                    width: 800,
                    alignItems: 'center',
                    items: [
                        button({
                            ...btnCfg,
                            text: 'Simple View',
                            onClick: () => model.addNewDockedView(true, true)
                        }),
                        button({
                            ...btnCfg,
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
                        button({
                            ...btnCfg,
                            text: ' Error View',
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
                        button({
                            ...btnCfg,
                            text: 'w/Dialog disabled',
                            onClick: () => model.addNewDockedView(false, true)
                        }),
                        button({
                            ...btnCfg,
                            text: 'w/Close disabled',
                            onClick: () => model.addNewDockedView(true, false)
                        })
                    ]
                }),
                dockContainer()
            ]
        });
    }
});

const btnCfg = {
    icon: Icon.add(),
    minimal: false,
    flex: 1,
    margin: 5
};

class DockContainerPanelModel extends HoistModel {
    @managed
    dockContainerModel = new DockContainerModel();

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
