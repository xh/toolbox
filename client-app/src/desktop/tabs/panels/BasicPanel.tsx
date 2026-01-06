import {parseMenuItems} from '@xh/hoist/utils/impl';
import React from 'react';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {div, filler, p, span} from '@xh/hoist/cmp/layout';
import {menu, menuDivider, popover} from '@xh/hoist/kit/blueprint';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {wait} from '@xh/hoist/promise';
import {wrapper} from '../../common';
import {usStates} from '../../../core/data';
import {BasicPanelModel} from './BasicPanelModel';

export const basicPanel = hoistCmp.factory({
    model: creates(BasicPanelModel),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    Panels are a core building block for layouts in Hoist. They support an optional
                    header bar with props to configure an icon, title and custom header items, props
                    for top and bottom toolbars, and an optional model to manage their sizing.
                </p>,
                <p>
                    Panels also provide a convenient prop for establishing an ErrorBoundary around
                    its contents, allowing the managed isolation of application content.
                </p>,
                <p>
                    See the other tabs at left for additional features and conveniences, including
                    built-in integrations with other Hoist components such as masks.
                </p>
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/panels/BasicPanel.tsx',
                    notes: 'This example.'
                },
                {url: '$HR/desktop/cmp/panel/Panel.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/desktop/cmp/panel/PanelModel.ts',
                    notes: 'Hoist component model (for resize / collapse).'
                }
            ],
            item: panel({
                icon: Icon.window(),
                title: 'Panels › Intro',
                height: 400,
                width: 700,
                compactHeader: model.compactHeader,
                modelConfig: {
                    errorBoundary: true,
                    collapsible: false,
                    resizable: false
                },
                headerItems: [
                    switchInput({
                        label: 'Compact Header',
                        labelSide: 'left',
                        bind: 'compactHeader'
                    }),
                    button({
                        tooltip: 'Header Button',
                        icon: Icon.gear(),
                        onClick: () =>
                            XH.toast({
                                message: `You clicked a button within Panel.headerItems.`
                            })
                    })
                ],
                contextMenu: model.appliedContextMenu,
                tbar: [
                    popover({
                        position: 'bottom-left',
                        minimal: true,
                        item: button({
                            icon: Icon.chevronDown(),
                            text: 'Menu Button'
                        }),
                        content: menu(
                            parseMenuItems([
                                {text: 'Menu Item 1', icon: Icon.rocket(), intent: 'success'},
                                {text: 'Menu Item 2', icon: Icon.skull(), intent: 'danger'},
                                {
                                    text: 'Menu Item 3',
                                    icon: Icon.placeholder(),
                                    disabled: true
                                },
                                menuDivider({title: 'Another Section'}),
                                {text: 'Menu Item 4'},
                                {
                                    text: 'Menu Item 5',
                                    items: ['Sub Item 1', 'Sub Item 2', 'Sub Item 3'].map(it => ({
                                        text: it,
                                        key: it
                                    }))
                                }
                            ])
                        )
                    }),
                    filler(),
                    span('Context Menu'),
                    switchInput({
                        bind: 'showContextMenu'
                    })
                ],
                items: [
                    div({
                        className: 'tb-panel-text-reader',
                        items: model.demoText.map(it => p(it))
                    }),
                    aComponentThatCanThrowInRender()
                ],
                bbar: [
                    button({
                        text: 'Simulate an Exception',
                        icon: Icon.skull(),
                        intent: 'danger',
                        onClick: () => (model.triggerError = true)
                    }),
                    filler(),
                    select({
                        bind: 'state',
                        options: usStates,
                        placeholder: 'Select a State...'
                    }),
                    toolbarSep(),
                    button({
                        text: 'Show Toast',
                        onClick: () =>
                            XH.toast({
                                message: `Currently selected State: ${model.state || 'None'}`
                            })
                    })
                ]
            })
        });
    }
});

// Demonstrates ErrorBoundary support built-in to Panel.
const aComponentThatCanThrowInRender = hoistCmp.factory<BasicPanelModel>({
    render({model}) {
        if (model.triggerError) {
            wait(0).then(() => (model.triggerError = false));
            throw XH.exception(
                'Whoops, I threw an error. Fortunately this Panel has its built-in ErrorBoundary enabled.'
            );
        }
        return null;
    }
});
