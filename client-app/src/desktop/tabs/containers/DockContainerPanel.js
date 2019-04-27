import React, {Component} from 'react';
import {XH, HoistComponent} from '@xh/hoist/core';
import {box, hbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dockContainer, DockContainerModel} from '@xh/hoist/cmp/dock';
import {wrapper, sampleGrid} from '../../common';

@HoistComponent
export class DockContainerPanel extends Component {

    dockContainerModel = new DockContainerModel({
        views: [
            {
                id: 'gridView',
                title: 'A complex docked component',
                icon: Icon.gridPanel(),
                content: sampleGrid({
                    width: 500,
                    height: 400
                })
            }
        ]
    });

    render() {
        const {dockContainerModel} = this,
            btnCfg = {
                icon: Icon.add(),
                minimal: false,
                flex: 1,
                margin: 5
            };

        return wrapper({
            description: [
                <p>
                    <code>DockContainer</code> provides a user-friendly way to display multiple
                    views simultaneously as docked overlays. Users can choose which views are
                    expanded or collapsed at any given time, or if so enabled they can pop a view
                    out of the dock and display it as a modal dialog.
                </p>,
                <p>
                    The states for docked views are based on the "compose" dialog within the
                    ubiquitous Gmail web client, and docked views are generally intended for data
                    entry forms, detail views, and other similar UI elements.
                </p>
            ],
            items: [
                hbox({
                    width: 700,
                    alignItems: 'center',
                    items: [
                        button({
                            ...btnCfg,
                            text: 'Add view',
                            onClick: () => this.addNewDockedView(true, true)
                        }),
                        button({
                            ...btnCfg,
                            text: 'Add view (dialog disabled)',
                            onClick: () => this.addNewDockedView(false, true)
                        }),
                        button({
                            ...btnCfg,
                            text: 'Add view (close disabled)',
                            onClick: () => this.addNewDockedView(true, false)
                        })
                    ]
                }),
                dockContainer({model: dockContainerModel})
            ]
        });
    }

    addNewDockedView(allowDialog, allowClose) {
        let text = 'You can add as many docked views as you want. ';
        if (!allowDialog) text += 'This view is configured so it cannot be expanded into a modal dialog.';
        if (!allowClose) text += 'This view is configured so it cannot be closed.';

        this.dockContainerModel.addView({
            id: XH.genId(),
            icon: Icon.add(),
            title: 'A simple docked panel',
            allowDialog,
            allowClose,
            content: panel({
                width: 250,
                height: 120,
                item: box({
                    padding: 10,
                    item: text
                })
            })
        });
    }

}