import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {filler, frame} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
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
            title: 'Dash Container',
            icon: Icon.layout(),
            description: [
                '`DashContainer` is configured and managed via a `DashContainerModel` and lets',
                'users drag and drop content into tabbed and split-pane layouts. It also',
                'supports publishing observable state, managed mounting and unmounting of',
                'inactive tabs, and lazy refreshing of the active view.',
                '',
                'Unlike `DashCanvas`, it fills the available space, resizing its widgets in',
                'both dimensions as the layout changes. Use the controls below to add views',
                'and to unmount and restore the dashboard, demonstrating that its state is',
                'preserved.'
            ],
            item: panel({
                width: '100%',
                height: '100%',
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
                    url: '$TB/client-app/src/desktop/tabs/layout/dashContainer/DashContainerPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/dash/README.md#dashcontainer',
                    text: 'Dashboard docs',
                    notes: 'Dashboard system guide (DashContainer and DashCanvas).'
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
                    notes: 'Model for contained view instances.'
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
                unique: true,
                content: gridWidget
            },
            {
                id: 'buttons',
                title: 'Buttons',
                icon: Icon.stop(),
                content: buttonWidget
            },
            {
                id: 'chart',
                title: 'Chart',
                icon: Icon.chartLine(),
                unique: true,
                refreshMode: 'onShowAlways',
                content: chartWidget
            },
            {
                id: 'panel',
                title: 'Panel',
                icon: Icon.window(),
                renderMode: 'always',
                content: panelWidget
            },
            {
                id: 'treeGrid',
                title: 'Tree Grid',
                content: treeGridWidget
            },
            {
                id: 'error',
                title: 'Error Example',
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
