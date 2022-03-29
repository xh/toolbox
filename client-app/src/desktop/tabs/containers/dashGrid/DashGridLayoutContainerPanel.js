import {switchInput, numberInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import React from 'react';
import {creates, hoistCmp, HoistModel, managed, RefreshMode, RenderMode, XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {filler, frame} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dashGridLayoutContainer, DashGridLayoutContainerModel} from '@xh/hoist/desktop/cmp/dashGrid';
import {buttonWidget, chartWidget, gridWidget, panelWidget, treeGridWidget} from '../widgets';
import {wrapper} from '../../../common';

export const dashGridLayoutContainerPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    <code>DashGridLayoutContainer</code> is configured and managed via a
                    <code>DashGridLayoutContainerModel</code> and allows the user to drag-and-drop content into various
                    scrollable layouts.  This component also supports publishing observable state, managed
                    mounting/unmounting of inactive tabs, and lazy refreshing of its active view.
                </p>
            ],
            item: panel({
                title: 'Containers › Dash',
                icon: Icon.gridLarge(),
                height: '80%',
                width: '80%',
                item: model.renderDashboard ?
                    frame(dashGridLayoutContainer()):
                    frame({
                        item: 'The Dashboard is not rendered now and has been unmounted. When rendered again, its previous state will be restored.',
                        padding: 10
                    }),
                bbar: bbar()
            }),
            links: [
                {url: '$TB/client-app/src/desktop/tabs/containers/dash/DashContainerPanel.js', notes: 'This example.'},
                {url: '$HR/desktop/cmp/dash/DashContainer.js', notes: 'Hoist container component.'},
                {url: '$HR/desktop/cmp/dash/DashContainerModel.js', notes: 'Hoist container model - primary API.'},
                {url: '$HR/desktop/cmp/dash/DashViewSpec.js', notes: 'Configuration template for contained views.'},
                {url: '$HR/desktop/cmp/dash/DashViewModel.js', notes: 'Model for contained view instances. '}
            ]
        });
    }
});

const bbar = hoistCmp.factory(
    ({model}) => toolbar(
        switchInput({
            label: 'Render Dashboard',
            bind: 'renderDashboard',
            labelSide: 'left'
        }),
        '-',
        /* TODO: Support these flags?
        switchInput({
            label: 'Layout Locked',
            bind: 'layoutLocked',
            labelSide: 'left',
            model: model.dashContainerModel
        }),
        '-',
        switchInput({
            label: 'Content Locked',
            bind: 'contentLocked',
            labelSide: 'left',
            model: model.dashContainerModel
        }),
        '-',
        switchInput({
            label: 'Rename Locked',
            bind: 'renameLocked',
            labelSide: 'left',
            model: model.dashContainerModel
        }),
         */
        'Columns',
        numberInput({
            width: 80,
            bind: 'columns',
            model: model.dashGridLayoutContainerModel
        }),
        '-',
        'Row Height (px)',
        numberInput({
            width: 80,
            bind: 'rowHeight',
            model: model.dashGridLayoutContainerModel
        }),
        filler(),
        button({
            text: 'Reset & Clear State',
            icon: Icon.reset(),
            onClick: () => model.resetState()
        })
    )
);

class Model extends HoistModel {
    @bindable renderDashboard = true;

    @managed
    dashGridLayoutContainerModel = new DashGridLayoutContainerModel({
        persistWith: {localStorageKey: 'dashGridLayoutContainerState'},
        showMenuButton: true,
        initialViews: [
            {
                id: 'grid',
                width: 8,
                y: 4
            },
            {
                id: 'buttons',
                x: 0,
                y: 0
            },
            {
                id: 'buttons',
                y: 2
            },
            {
                id: 'panel',
                x: 5,
                y: 0,
                width: 3,
                height: 4
            },
            {
                id: 'treeGrid',
                y: 8
            }
        ],
        viewSpecDefaults: {
            icon: Icon.grid()
        },
        viewSpecs: [
            {
                id: 'grid',
                title: 'Grid',
                unique: true,
                content: gridWidget,
                initWidth: 5,
                initHeight: 5
            },
            {
                id: 'buttons',
                title: 'Buttons',
                icon: Icon.question(),
                content: buttonWidget,
                initWidth: 5,
                initHeight: 2,
                allowRemove: false,
                allowRename: false
            },
            {
                id: 'chart',
                title: 'Chart',
                icon: Icon.chartLine(),
                unique: true,
                refreshMode: RefreshMode.ON_SHOW_ALWAYS,
                content: chartWidget,
                initWidth: 8,
                initHeight: 5
            },
            {
                id: 'panel',
                title: 'Panel',
                icon: Icon.window(),
                renderMode: RenderMode.ALWAYS,
                content: panelWidget
                // initWidth and initHeight default to 3 when not specified
                // Maybe the default value should be configurable at the container level?
            },
            {
                id: 'treeGrid',
                title: 'Tree Grid',
                content: treeGridWidget,
                initWidth: 8,
                initHeight: 6
            }
        ]
    });

    constructor() {
        super();
        makeObservable(this);
    }

    resetState() {
        this.dashGridLayoutContainerModel.restoreDefaults();
        XH.toast({message: 'Dash state reset to default'});
    }
}
