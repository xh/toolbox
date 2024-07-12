import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import React from 'react';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {filler, frame} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button, refreshButton} from '@xh/hoist/desktop/cmp/button';
import {dashContainer, DashContainerModel} from '@xh/hoist/desktop/cmp/dash';
import {
    buttonWidget,
    chartWidget,
    gridWidget,
    panelWidget,
    treeGridWidget,
    errorWidget
} from '../widgets';
import {wrapper} from '../../../common';

export const dashContainerPanel = hoistCmp.factory({
    model: creates(() => DashContainerPanelModel),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    <code>DashContainer</code> is configured and managed via a{' '}
                    <code>DashContainerModel</code>
                    and allows the user to drag-and-drop content into various tab, and split-pane
                    layouts. This component also supports publishing observable state, managed
                    mounting/unmounting of inactive tabs, and lazy refreshing of its active view.
                </p>
            ],
            item: panel({
                title: 'Layout › Dash Container',
                icon: Icon.layout(),
                headerItems: [refreshButton({minimal: true, intent: null})],
                height: '80%',
                width: '80%',
                item: model.renderDashboard
                    ? dashContainer()
                    : frame({
                          item: 'The Dashboard is not rendered now and has been unmounted. When rendered again, its previous state will be restored.',
                          padding: 10
                      }),
                bbar: bbar()
            }),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/dashContainer/DashContainerPanel.tsx',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/dash/container/DashContainer.ts',
                    notes: 'Hoist container component.'
                },
                {
                    url: '$HR/desktop/cmp/dash/container/DashContainerModel.ts',
                    notes: 'Hoist container model - primary API.'
                },
                {
                    url: '$HR/desktop/cmp/dash/DashViewSpec.ts',
                    notes: 'Configuration template for contained views.'
                },
                {
                    url: '$HR/desktop/cmp/dash/DashViewModel.ts',
                    notes: 'Model for contained view instances. '
                }
            ]
        });
    }
});

const bbar = hoistCmp.factory<DashContainerPanelModel>(({model}) =>
    toolbar(
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
        filler(),
        button({
            text: 'Reset & Clear State',
            icon: Icon.reset(),
            onClick: () => model.resetState()
        })
    )
);

class DashContainerPanelModel extends HoistModel {
    @bindable renderDashboard = true;

    @managed
    dashContainerModel = new DashContainerModel({
        persistWith: {localStorageKey: 'dashContainerExampleState'},
        showMenuButton: true,
        initialState: [
            {
                type: 'row',
                content: [
                    {
                        type: 'stack',
                        width: 60,
                        content: [
                            {type: 'view', id: 'grid'},
                            {type: 'view', id: 'treeGrid'},
                            {type: 'view', id: 'error'}
                        ]
                    },
                    {
                        type: 'column',
                        width: 40,
                        content: [
                            {type: 'view', id: 'chart'},
                            {type: 'view', id: 'buttons', height: '200px'}
                        ]
                    }
                ]
            }
        ],
        viewSpecDefaults: {
            icon: Icon.grid()
        },
        viewSpecs: [
            {
                id: 'grid',
                title: 'Grid',
                groupName: 'Grids',
                unique: true,
                content: gridWidget
            },
            {
                id: 'treeGrid',
                title: 'Tree Grid',
                groupName: 'Grids',
                content: treeGridWidget
            },
            {
                id: 'buttons',
                title: 'Buttons',
                groupName: 'Layout',
                icon: Icon.stop(),
                content: buttonWidget
            },
            {
                id: 'chart',
                title: 'Chart',
                groupName: 'Layout',
                icon: Icon.chartLine(),
                unique: true,
                refreshMode: 'onShowAlways',
                content: chartWidget
            },
            {
                id: 'panel',
                title: 'Panel',
                groupName: 'Layout',
                icon: Icon.window(),
                renderMode: 'always',
                content: panelWidget
            },
            {
                id: 'error',
                title: 'Error Example',
                groupName: 'Error',
                content: errorWidget({componentName: 'DashContainer'})
            }
        ]
    });

    constructor() {
        super();
        makeObservable(this);
    }

    resetState() {
        this.dashContainerModel
            .restoreDefaultsAsync()
            .then(() => XH.toast({message: 'Dash state reset to default'}));
    }
}
