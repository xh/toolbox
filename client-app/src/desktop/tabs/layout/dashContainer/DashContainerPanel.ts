import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {frame} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dashContainer, DashContainerModel} from '@xh/hoist/desktop/cmp/dash';
import {
    optionsWidget,
    chartWidget,
    gridWidget,
    panelWidget,
    treeGridWidget,
    errorWidget
} from '../widgets';
import {wrapper, wrapperAction, wrapperOption} from '../../../common';

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
                'both dimensions as the layout changes. Use the options to unmount and restore',
                'the dashboard, demonstrating that its state is preserved.'
            ],
            options: [
                wrapperOption({
                    label: 'Render Dashboard',
                    control: switchInput({model, bind: 'renderDashboard'})
                }),
                wrapperOption({
                    label: 'Layout Locked',
                    propName: 'DashContainerConfig.layoutLocked',
                    control: switchInput({model: model.dashContainerModel, bind: 'layoutLocked'}),
                    info: 'Prevent re-arranging views.'
                }),
                wrapperOption({
                    label: 'Content Locked',
                    propName: 'DashContainerConfig.contentLocked',
                    control: switchInput({model: model.dashContainerModel, bind: 'contentLocked'}),
                    info: 'Prevent adding or removing views.'
                }),
                wrapperOption({
                    label: 'Rename Locked',
                    propName: 'DashContainerConfig.renameLocked',
                    control: switchInput({model: model.dashContainerModel, bind: 'renameLocked'}),
                    info: 'Prevent renaming views.'
                }),
                wrapperAction({
                    text: 'Reset & Clear State',
                    icon: Icon.reset(),
                    intent: 'danger',
                    onClick: () => model.resetState()
                })
            ],
            item: panel({
                width: '100%',
                height: '100%',
                item: model.renderDashboard
                    ? dashContainer()
                    : frame({
                          item: 'The Dashboard is not rendered now and has been unmounted. When rendered again, its previous state will be restored.',
                          padding: 10
                      })
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

class DashContainerPanelModel extends HoistModel {
    @bindable renderDashboard = true;

    @managed
    dashContainerModel = new DashContainerModel({
        persistWith: {localStorageKey: 'dashContainerExampleStateV3'},
        showMenuButton: true,
        initialState: [
            {
                type: 'row',
                content: [
                    {
                        type: 'column',
                        width: 72,
                        content: [
                            {type: 'view', id: 'treeGrid', height: 60},
                            {
                                type: 'row',
                                height: 40,
                                content: [
                                    {type: 'view', id: 'chart', width: 52},
                                    {
                                        type: 'stack',
                                        width: 48,
                                        content: [
                                            {type: 'view', id: 'options'},
                                            {type: 'view', id: 'error'}
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {type: 'view', id: 'grid', width: 28}
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
                id: 'options',
                title: 'Options',
                icon: Icon.settings(),
                content: optionsWidget
            },
            {
                id: 'chart',
                title: 'Live Chart',
                icon: Icon.chartLine(),
                unique: true,
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
                icon: Icon.treeList(),
                content: treeGridWidget
            },
            {
                id: 'error',
                title: 'Error Example',
                icon: Icon.skull(),
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
