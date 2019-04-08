import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {box, hbox, filler} from '@xh/hoist/cmp/layout';
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
                title: 'Grids > Standard',
                icon: Icon.gridPanel(),
                content: sampleGrid({
                    width: 800,
                    height: 400
                })
            }
        ]
    });

    render() {
        const {dockContainerModel} = this;
        return wrapper({
            description: [
                <p>
                    DockContainers provide a user-friendly way to display multiple views simultaneously,
                    by allowing users to choose which views are expanded or collapsed at any given time.
                    Docked views also support being taken out of the dock and displayed as a dialog.
                </p>,
                hbox(
                    filler(),
                    button({
                        text: 'Add New View',
                        icon: Icon.add(),
                        onClick: () => this.addNewDockedView()
                    }),
                    filler()
                )
            ],
            item: dockContainer({model: dockContainerModel})
        });
    }

    addNewDockedView() {
        this.dockContainerModel.addView({
            icon: Icon.add(),
            title: 'View',
            allowDialog: false,
            content: panel({
                width: 220,
                height: 100,
                item: box({
                    padding: 10,
                    item: 'You can add as many docked views as you want.'
                })
            })
        });
    }

}