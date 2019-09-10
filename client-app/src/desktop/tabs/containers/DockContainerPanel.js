import React from 'react';
import {XH, HoistModel, hoistCmp, create, managed} from '@xh/hoist/core';
import {box, br, hbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dockContainer, DockContainerModel} from '@xh/hoist/cmp/dock';
import {wrapper, sampleGrid} from '../../common';

export const DockContainerPanel = hoistCmp({
    model: create(() => new Model()),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    <code>DockContainer</code> provides a user-friendly way to display multiple
                    views simultaneously as docked overlays.
                </p>,
                <p>
                    Users can choose which views are expanded or collapsed at any given time,
                    or if so enabled they can pop a view out of the dock and display it as a
                    modal dialog.
                </p>,
                <p>
                    The states for docked views are based on the "compose" dialog within the
                    ubiquitous Gmail web client, and docked views are generally intended for data
                    entry forms, detail views, and other similar UI elements.
                </p>,
                <p>
                    Use the buttons below to test adding views to a container within this tab.
                </p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/containers/DockContainerPanel.js', notes: 'This example.'},
                {url: '$HR/cmp/dock/DockContainer.js', notes: 'Hoist container component.'},
                {url: '$HR/cmp/dock/DockContainerModel.js', notes: 'Hoist container model - primary API and configuration point for views.'},
                {url: '$HR/cmp/dock/DockViewModel.js', notes: 'Hoist view model - created by DockContainerModel in its ctor from provided configs.'}
            ],
            items: [
                hbox({
                    width: 700,
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
                                    content: sampleGrid({
                                        width: 500,
                                        height: 400
                                    })
                                });
                            }
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
                dockContainer({model: model.dockContainerModel})
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


@HoistModel
class Model {

    @managed
    dockContainerModel = new DockContainerModel();

    addView(...args) {
        this.dockContainerModel.addView(...args);
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
            allowDialog,
            allowClose,
            content: panel({
                width: 250,
                height: 120,
                item: box({items: textItems, padding: 10})
            })
        });
    }

}