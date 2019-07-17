import React, {Component} from 'react';
import {p, div} from '@xh/hoist/cmp/layout';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {XH, HoistComponent} from '@xh/hoist/core/index';
import {wrapper} from '../../common/Wrapper';
import {filler} from '@xh/hoist/cmp/layout/index';
import {panel} from '@xh/hoist/desktop/cmp/panel/index';
import {select} from '@xh/hoist/desktop/cmp/input';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar/index';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {Icon} from '@xh/hoist/icon/index';
import {usStates} from '../../../core/data/index';
import {BasicPanelModel} from './BasicPanelModel';

@HoistComponent
export class BasicPanel extends Component {
    basicPanelModel = new BasicPanelModel();

    render() {
        const model = this.basicPanelModel;

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
                {
                    url: '$TB/client-app/src/desktop/tabs/panels/BasicPanel.js',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/panel/Panel.js',
                    notes: 'Hoist component.'
                },
                {
                    url: '$HR/desktop/cmp/panel/PanelModel.js',
                    notes: 'Hoist component model (for resize / collapse).'
                }
            ],
            item: panel({
                icon: Icon.window(),
                title: 'Panels › Intro',
                height: 400,
                width: 700,
                tbar: toolbar(
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
                ),
                item: div({
                    className: 'toolbox-panel-text-reader',
                    items: model.demoText.map(it => p(it))
                }),
                bbar: toolbar(
                    filler(),
                    select({
                        model,
                        bind: 'state',
                        options: usStates,
                        placeholder: 'Select a State...'
                    }),
                    toolbarSep(),
                    button({
                        text: 'Show Toast',
                        onClick: this.onShowToastClick
                    })
                )
            })
        });
    }

    onShowToastClick = () => {
        XH.toast({
            message: `Currently selected State: ${this.basicPanelModel.state || 'None'}`
        });
    }
}