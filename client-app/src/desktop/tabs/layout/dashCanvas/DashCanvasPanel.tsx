import {switchInput, numberInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import React from 'react';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {filler, frame} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dashCanvas, DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import {
    buttonWidget,
    chartWidget,
    errorWidget,
    gridWidget,
    panelWidget,
    treeGridWidget
} from '../widgets';
import {wrapper} from '../../../common';

export const dashCanvasPanel = hoistCmp.factory({
    model: creates(() => Model),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    <code>DashCanvas</code> is configured and managed via a{' '}
                    <code>DashCanvasModel</code> and allows the user to drag-and-drop configured
                    widgets into highly-customizable layouts.
                </p>,
                <p>
                    Unlike its cousin <code>DashContainer</code>, this component scales the{' '}
                    <em>width only</em> of its child widgets as its overall size changes, leaving
                    heights unchanged and scrolling internally as necessary. This makes it a good
                    candidate for report-style dashboards containing lots of content that is
                    unlikely to fit or compress nicely on smaller screens. Consider{' '}
                    <code>DashContainer</code> instead when a space-filling layout is a priority.
                </p>
            ],
            item: panel({
                title: 'Layout › DashCanvas',
                icon: Icon.layout(),
                headerItems: [refreshButton({minimal: true, intent: null})],
                height: '80%',
                width: '80%',
                item: model.renderDashboard
                    ? frame(dashCanvas())
                    : frame({
                          item: 'The Dashboard is not rendered now and has been unmounted. When rendered again, its previous state will be restored.',
                          padding: 10
                      }),
                bbar: bbar()
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/dashCanvas/DashCanvasPanel.tsx',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/dash/canvas/DashCanvas.ts',
                    notes: 'Hoist container component.'
                },
                {
                    url: '$HR/desktop/cmp/dash/canvas/DashCanvasModel.ts',
                    notes: 'Hoist container model - primary API.'
                },
                {
                    url: '$HR/desktop/cmp/dash/canvas/DashCanvasViewSpec.ts',
                    notes: 'Configuration template for contained views.'
                },
                {
                    url: '$HR/desktop/cmp/dash/canvas/DashCanvasViewModel.ts',
                    notes: 'Model for contained view instances. '
                }
            ]
        });
    }
});

const bbar = hoistCmp.factory<Model>(({model}) =>
    toolbar({
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
        persistWith: {localStorageKey: 'dashCanvasExampleState'},
        initialState,
        viewSpecDefaults: {
            icon: Icon.gridPanel()
        },
        viewSpecs: [
            {
                id: 'grid',
                title: 'Grid',
                unique: true,
                content: gridWidget,
                width: 6,
                height: 5,
                groupName: 'Grid Widgets'
            },
            {
                id: 'treeGrid',
                title: 'Tree Grid',
                content: treeGridWidget,
                width: 12,
                height: 8,
                groupName: 'Grid Widgets'
            },
            {
                id: 'buttons',
                title: 'Buttons',
                icon: Icon.stop(),
                content: buttonWidget,
                width: 4,
                height: 2,
                allowRename: false,
                hideMenuButton: true
            },
            {
                id: 'chart',
                title: 'Chart',
                icon: Icon.chartLine(),
                unique: true,
                content: chartWidget,
                width: 12,
                height: 5
            },
            {
                id: 'panel',
                title: 'Panel',
                icon: Icon.window(),
                content: panelWidget
            },
            {
                id: 'error',
                title: 'Error Example',
                icon: Icon.skull(),
                unique: true,
                content: errorWidget({componentName: 'DashCanvas'})
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
        layout: {
            x: 0,
            y: 0,
            w: 12,
            h: 5
        },
        viewSpecId: 'chart'
    },
    {
        layout: {
            x: 0,
            y: 5,
            w: 4,
            h: 3
        },
        viewSpecId: 'buttons',
        title: 'Buttons 1',
        state: {
            value: 'Button 1'
        }
    },
    {
        layout: {
            x: 4,
            y: 5,
            w: 4,
            h: 3
        },
        viewSpecId: 'buttons',
        title: 'Buttons 2',
        state: {
            value: 'Button 2'
        }
    },
    {
        layout: {
            x: 8,
            y: 5,
            w: 4,
            h: 3
        },
        viewSpecId: 'buttons',
        title: 'Buttons 3',
        state: {
            value: 'Button 3'
        }
    },
    {
        layout: {
            x: 9,
            y: 8,
            w: 3,
            h: 4
        },
        viewSpecId: 'panel'
    },
    {
        layout: {
            x: 0,
            y: 8,
            w: 9,
            h: 7
        },
        viewSpecId: 'treeGrid'
    },
    {
        layout: {
            x: 0,
            y: 15,
            w: 6,
            h: 6
        },
        viewSpecId: 'error'
    }
];
