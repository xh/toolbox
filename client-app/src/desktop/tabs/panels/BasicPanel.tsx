import React from 'react';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {div, filler, p} from '@xh/hoist/cmp/layout';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {wrapper} from '../../common';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {select} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {usStates} from '../../../core/data';
import {BasicPanelModel} from './BasicPanelModel';

export const basicPanel = hoistCmp.factory({
    model: creates(BasicPanelModel),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    Panels are a core building block for layouts in Hoist. They support an optional
                    header bar with props to configure an icon, title and custom header items,
                    props for top and bottom toolbars, and an optional model to manage their sizing.
                    See the other tabs at left for additional features and conveniences, including
                    built-in integrations with other Hoist components such as masks.
                </p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/panels/BasicPanel.js', notes: 'This example.'},
                {url: '$HR/desktop/cmp/panel/Panel.js', notes: 'Hoist component.'},
                {url: '$HR/desktop/cmp/panel/PanelModel.js', notes: 'Hoist component model (for resize / collapse).'}
            ],
            item: panel({
                icon: Icon.window(),
                title: 'Panels › Intro',
                height: 400,
                width: 700,
                tbar: [
                    popover({
                        position: 'bottom-left',
                        minimal: true,
                        target: button({
                            icon: Icon.chevronDown(),
                            text: 'Menu Button'
                        }),
                        content: menu(
                            menuItem({text: 'Menu Item'}),
                            menuItem({text: 'Menu Item 2'}),
                            menuItem({text: 'Menu Item 3'})
                        )
                    })
                ],
                item: div({
                    className: 'toolbox-panel-text-reader',
                    items: model.demoText.map(it => p(it))
                }),
                bbar: [
                    filler(),
                    select({
                        bind: 'state',
                        options: usStates,
                        placeholder: 'Select a State...'
                    }),
                    toolbarSep(),
                    button({
                        text: 'Show Toast',
                        onClick: () => XH.toast({
                            message: `Currently selected State: ${model.state || 'None'}`
                        })
                    })
                ]
            })
        });
    }
});