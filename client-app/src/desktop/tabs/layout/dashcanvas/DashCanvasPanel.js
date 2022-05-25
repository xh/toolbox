import {switchInput, numberInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import React from 'react';
import {creates, hoistCmp, HoistModel, managed, RefreshMode, RenderMode, XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {filler, frame} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {dashCanvas, DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import {buttonWidget, chartWidget, gridWidget, panelWidget, treeGridWidget} from '../widgets';
import {wrapper} from '../../../common';

export const dashCanvasPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    <code>DashCanvas</code> is configured and managed via a
                    <code>DashCanvasModel</code> and allows the user to drag-and-drop content into various
                    scrollable layouts.

                    This component also supports publishing observable state.
                </p>,
                <p>
                    <strong>NOTE: This component is currently in BETA and its API is subject to change.</strong>
                </p>
            ],
            item: panel({
                title: 'Layout › DashCanvas',
                icon: Icon.gridLarge(),
                height: '80%',
                width: '80%',
                item: model.renderDashboard ?
                    frame(dashCanvas()):
                    frame({
                        item: 'The Dashboard is not rendered now and has been unmounted. When rendered again, its previous state will be restored.',
                        padding: 10
                    }),
                bbar: bbar()
            }),
            links: [
                {url: '$TB/client-app/src/desktop/tabs/layout/dashCanvas/DashCanvasPanel.js', notes: 'This example.'},
                {url: '$HR/desktop/cmp/dash/canvas/DashCanvas.js', notes: 'Hoist container component.'},
                {url: '$HR/desktop/cmp/dash/canvas/DashCanvasModel.js', notes: 'Hoist container model - primary API.'},
                {url: '$HR/desktop/cmp/dash/canvas/DashCanvasViewSpec.js', notes: 'Configuration template for contained views.'},
                {url: '$HR/desktop/cmp/dash/canvas/DashCanvasViewModel.js', notes: 'Model for contained view instances. '}
            ]
        });
    }
});

const bbar = hoistCmp.factory(
    ({model}) => toolbar({
        enableOverflowMenu: true,
        children: [
            switchInput({
                label: 'Render Dashboard',
                bind: 'renderDashboard',
                labelSide: 'left'
            }),
            '-',
            switchInput({
                label: 'Layout Locked',
                bind: 'layoutLocked',
                labelSide: 'left',
                model: model.dashCanvasModel
            }),
            '-',
            switchInput({
                label: 'Content Locked',
                bind: 'contentLocked',
                labelSide: 'left',
                model: model.dashCanvasModel
            }),
            '-',
            switchInput({
                label: 'Rename Locked',
                bind: 'renameLocked',
                labelSide: 'left',
                model: model.dashCanvasModel
            }),
            '-',
            'Columns',
            numberInput({
                width: 80,
                bind: 'columns',
                model: model.dashCanvasModel
            }),
            '-',
            'Row Ht.',
            numberInput({
                width: 80,
                bind: 'rowHeight',
                model: model.dashCanvasModel
            }),
            '-',
            switchInput({
                bind: 'compact',
                label: 'Compact Views',
                model: model.dashCanvasModel
            }),
            filler(),
            button({
                text: 'Reset State',
                icon: Icon.reset(),
                onClick: () => model.resetState()
            })
        ]
    })
);

class Model extends HoistModel {
    @bindable renderDashboard = true;

    @managed
    dashCanvasModel = new DashCanvasModel({
        persistWith: {localStorageKey: 'dashCanvasState'},
        showMenuButton: true,
        initialState,
        viewSpecDefaults: {
            icon: Icon.grid()
        },
        viewSpecs: [
            {
                id: 'grid',
                title: 'Grid',
                unique: true,
                content: gridWidget,
                width: 5,
                height: 5,
                groupName: 'Group 1',
                extraMenuItems: [{
                    text: 'Pass GO',
                    icon: Icon.dollarSign(),
                    actionFn: () => XH.toast('Collect $200')
                }]
            },
            {
                id: 'buttons',
                title: 'Buttons',
                icon: Icon.question(),
                content: buttonWidget,
                width: 5,
                height: 2,
                allowRename: false,
                hideMenuButton: true,
                headerItems: [
                    button({
                        icon: Icon.toast({prefix: 'fas'}),
                        onClick: () => XH.toast('Toast is ready!')
                    })
                ]
            },
            {
                id: 'chart',
                title: 'Chart',
                icon: Icon.chartLine(),
                unique: true,
                refreshMode: RefreshMode.ON_SHOW_ALWAYS,
                content: chartWidget,
                width: 8,
                height: 5
            },
            {
                id: 'panel',
                title: 'Panel',
                icon: Icon.window(),
                renderMode: RenderMode.ALWAYS,
                content: panelWidget
            },
            {
                id: 'treeGrid',
                title: 'Tree Grid',
                content: treeGridWidget,
                width: 8,
                height: 6
            }
        ]
    });

    constructor() {
        super();
        makeObservable(this);
    }

    resetState() {
        this.dashCanvasModel.restoreDefaults();
        XH.toast({message: 'Dash state reset to default'});
    }
}

const initialState = [
    {
        viewSpecId: 'chart',
        title: 'Chart',
        viewState: null,
        viewLayout: {
            w: 5,
            h: 6,
            x: 0,
            y: 0
        }
    },
    {
        viewSpecId: 'buttons',
        title: 'Buttons 1',
        viewState: null,
        viewLayout: {
            w: 3,
            h: 2,
            x: 5,
            y: 0
        }
    },
    {
        viewSpecId: 'buttons',
        title: 'Buttons 2',
        viewState: {
            value: 'Button 2'
        },
        viewLayout: {
            w: 3,
            h: 2,
            x: 5,
            y: 2
        }
    },
    {
        viewSpecId: 'buttons',
        title: 'Buttons 3',
        viewState: {
            value: 'Button 3'
        },
        viewLayout: {
            w: 3,
            h: 2,
            x: 5,
            y: 4
        }
    },
    {
        viewSpecId: 'panel',
        title: 'Panel',
        viewState: null,
        viewLayout: {
            w: 1,
            h: 6,
            x: 7,
            y: 6
        }
    },
    {
        viewSpecId: 'treeGrid',
        title: 'Tree Grid',
        viewState: null,
        viewLayout: {
            w: 7,
            h: 6,
            x: 0,
            y: 6
        }
    }
];