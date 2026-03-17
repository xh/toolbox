import {filler, p, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {drawer, drawerToggleButton} from '@xh/hoist/desktop/cmp/drawer';
import {segmentedControl} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common';
import {DrawerPanelModel} from './DrawerPanelModel';

export const drawerPanel = hoistCmp.factory({
    model: creates(DrawerPanelModel),

    render({model}) {
        return wrapper({
            description: [
                p(
                    'Drawers provide a panel-integrated side panel that supports three display modes: overlay (floating), pinned (docked inline), and collapsed (narrow toolbar strip or hidden).'
                ),
                p(
                    'Configure drawers via the lDrawer and rDrawer props on Panel. Each drawer manages its own mode state via a DrawerModel, which can be auto-created from props or provided explicitly.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/panels/DrawerPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/drawer/Drawer.ts', notes: 'Hoist component.'},
                {url: '$HR/desktop/cmp/drawer/DrawerModel.ts', notes: 'Hoist component model.'}
            ],
            item: panel({
                icon: Icon.window(),
                title: 'Drawers',
                height: 500,
                width: 900,
                modelConfig: {collapsible: false, resizable: false},
                headerItems: [
                    span('Left:'),
                    drawerToggleButton({
                        drawerModel: model.leftDrawerModel,
                        text: 'Toggle',
                        minimal: false
                    }),
                    toolbarSep(),
                    span('Right:'),
                    drawerToggleButton({
                        drawerModel: model.rightDrawerModel,
                        text: 'Toggle',
                        minimal: false
                    })
                ],
                lDrawer: drawer({
                    model: model.leftDrawerModel,
                    title: 'Navigation',
                    icon: Icon.bars(),
                    collapsedItems: [
                        button({icon: Icon.home(), minimal: true, tooltip: 'Home'}),
                        button({icon: Icon.users(), minimal: true, tooltip: 'Users'}),
                        button({icon: Icon.chartLine(), minimal: true, tooltip: 'Reports'}),
                        filler(),
                        drawerToggleButton({
                            drawerModel: model.leftDrawerModel,
                            action: 'pin'
                        })
                    ],
                    items: [navMenuContent()]
                }),
                rDrawer: drawer({
                    model: model.rightDrawerModel,
                    title: 'Details',
                    icon: Icon.info(),
                    items: [detailContent()]
                }),
                tbar: [
                    span('Left Mode:'),
                    segmentedControl({
                        value: model.leftDrawerModel.mode,
                        onChange: v => model.leftDrawerModel.setMode(v),
                        options: [
                            {value: 'overlay', label: 'Overlay'},
                            {value: 'pinned', label: 'Pinned'},
                            {value: 'collapsed', label: 'Collapsed'}
                        ],
                        intent: 'primary'
                    }),
                    toolbarSep(),
                    span('Right Mode:'),
                    segmentedControl({
                        value: model.rightDrawerModel.mode,
                        onChange: v => model.rightDrawerModel.setMode(v),
                        options: [
                            {value: 'overlay', label: 'Overlay'},
                            {value: 'pinned', label: 'Pinned'}
                        ],
                        intent: 'primary'
                    })
                ],
                items: [
                    panel({
                        flex: 'auto',
                        items: [
                            p(
                                'This is the main content area. Use the toolbar above or header buttons to control the drawers.'
                            ),
                            p(
                                'The left drawer supports all three modes: overlay, pinned, and collapsed with a vertical toolbar strip.'
                            ),
                            p('The right drawer supports overlay and pinned modes only.')
                        ]
                    })
                ]
            })
        });
    }
});

const navMenuContent = hoistCmp.factory({
    model: false,
    render() {
        return panel({
            items: [
                button({
                    icon: Icon.home(),
                    text: 'Home',
                    minimal: true,
                    style: {justifyContent: 'flex-start'}
                }),
                button({
                    icon: Icon.users(),
                    text: 'Users',
                    minimal: true,
                    style: {justifyContent: 'flex-start'}
                }),
                button({
                    icon: Icon.chartLine(),
                    text: 'Reports',
                    minimal: true,
                    style: {justifyContent: 'flex-start'}
                }),
                button({
                    icon: Icon.gear(),
                    text: 'Settings',
                    minimal: true,
                    style: {justifyContent: 'flex-start'}
                })
            ]
        });
    }
});

const detailContent = hoistCmp.factory({
    model: false,
    render() {
        return panel({
            items: [
                p('Detail view content would go here.'),
                p(
                    'This drawer is configured with overlay and pinned modes only - no collapsed toolbar strip.'
                )
            ]
        });
    }
});
