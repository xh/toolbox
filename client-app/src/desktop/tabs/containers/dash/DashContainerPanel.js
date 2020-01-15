import React from 'react';
import {XH, creates, hoistCmp, HoistModel, managed, RenderMode, RefreshMode} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dashContainer, DashContainerModel} from '@xh/hoist/desktop/cmp/dash';

import {
    ButtonWidget,
    ButtonWidgetModel,
    ChartWidget,
    GridWidget,
    GridWidgetModel,
    PanelWidget,
    TreeGridWidget
} from './widgets';

import {wrapper} from '../../../common';

export const DashContainerPanel = hoistCmp({
    model: creates(() => new Model()),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    <code>DashContainer</code> is configured and managed via a <code>DashContainerModel</code>
                    and allows the user to drag-and-drop content into various tab, and split-pane layouts.

                    This component also supports publishing observable state, managed mounting/unmounting of inactive
                    tabs, and lazy refreshing of its active Tab.
                </p>,
                <p>
                    <b> Note:  This component is currently in alpha release</b>.  Its functionality and API
                    is still subject to change. Applications should use with care.
                </p>
            ],
            item: panel({
                title: 'Containers › Dash',
                icon: Icon.gridLarge(),
                height: '80%',
                width: '80%',
                item: dashContainer(),
                bbar: [
                    button({
                        text: 'Reset & Clear State',
                        onClick: () => model.resetState()
                    }),
                    filler(),
                    button({
                        text: 'Capture State',
                        icon: Icon.camera(),
                        onClick: () => model.saveState()
                    }),
                    button({
                        disabled: !model.stateSnapshot,
                        text: 'Load Saved State',
                        icon: Icon.upload(),
                        onClick: () => model.loadState()
                    })
                ]
            }),
            links: [
                {url: '$TB/client-app/src/desktop/tabs/containers/dash/DashContainerPanel.js', notes: 'This example.'},
                {url: '$HR/desktop/cmp/dash/DashContainer.js', notes: 'Hoist container component.'},
                {url: '$HR/desktop/cmp/dash/DashContainerModel.js', notes: 'Hoist container model - primary API.'},
                {url: '$HR/desktop/cmp/dash/DashViewSpec.js', notes: 'Configuration for contained views.'}
            ]
        });
    }
});

@HoistModel
class Model {

    stateKey = 'dashContainerState';

    @bindable.ref stateSnapshot;

    defaultState = [{
        type: 'row',
        content: [
            {
                type: 'stack',
                content: [
                    {type: 'view', id: 'grid'},
                    {type: 'view', id: 'treeGrid'}
                ]
            },
            {
                type: 'column',
                content: [
                    {type: 'view', id: 'chart'},
                    {type: 'view', id: 'buttons'}
                ]
            }
        ]
    }];

    @managed
    dashContainerModel = new DashContainerModel({
        initialState: XH.localStorageService.get(this.stateKey, this.defaultState),
        viewSpecs: [
            {
                id: 'grid',
                title: 'Grid',
                icon: Icon.gridPanel(),
                unique: true,
                allowClose: false,
                content: GridWidget,
                contentModelFn: () => new GridWidgetModel()
            },
            {
                id: 'buttons',
                title: 'Buttons',
                icon: Icon.question(),
                content: ButtonWidget,
                contentModelFn: () => new ButtonWidgetModel()
            },
            {
                id: 'chart',
                title: 'Chart',
                icon: Icon.chartLine(),
                unique: true,
                refreshMode: RefreshMode.ON_SHOW_ALWAYS,
                content: ChartWidget
            },
            {
                id: 'panel',
                title: 'Panel',
                icon: Icon.window(),
                renderMode: RenderMode.ALWAYS,
                content: PanelWidget
            },
            {
                id: 'treeGrid',
                title: 'Tree Grid',
                icon: Icon.grid(),
                content: TreeGridWidget
            }
        ]
    });

    constructor() {
        this.addReaction({
            track: () => this.dashContainerModel.state,
            run: (state) => XH.localStorageService.set(this.stateKey, state)
        });
    }

    saveState() {
        this.setStateSnapshot(this.dashContainerModel.state);
        XH.toast({message: 'Dash state snapshot captured!'});
    }

    loadState() {
        this.dashContainerModel.loadStateAsync(this.stateSnapshot).then(() => {
            XH.toast({message: 'Dash state snapshot loaded!'});
        });
    }

    resetState() {
        XH.localStorageService.remove(this.stateKey);
        this.dashContainerModel.loadStateAsync(this.defaultState).then(() => {
            XH.toast({message: 'Dash state reset to default'});
        });
    }
}
