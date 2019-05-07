import {Component} from 'react';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {XH, HoistComponent} from '@xh/hoist/core/index';
import {wrapper} from '../../common/Wrapper';
import {filler, hframe} from '@xh/hoist/cmp/layout/index';
import {panel} from '@xh/hoist/desktop/cmp/panel/index';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar/index';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {Icon} from '@xh/hoist/icon/index';
import {usStates} from '../../../core/data/index';
import {ToolbarPanelModel} from './ToolbarPanelModel';

@HoistComponent
export class ToolbarPanel extends Component {
    toolBarModel = new ToolbarPanelModel();

    render() {
        const model = this.toolBarModel;

        return wrapper({
            description: `
                Toolbars (in case you have never seen one) are horizontal or vertical containers 
                with distinct styling and managed spacing between items. Support for top and bottom
                toolbars is built into Panel via its tbar/bbar props, but they can be used on their
                own and can be displayed in a vertical configuration as well. 
            `,
            item: panel({
                title: 'Containers › Toolbar',
                height: 400,
                width: 700,
                tbar: toolbar(
                    button({
                        icon: Icon.add(),
                        text: 'New',
                        intent: 'success'
                    }),
                    toolbarSep(),
                    button({
                        icon: Icon.edit(),
                        text: 'Edit',
                        intent: 'primary'
                    }),
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
                    }),
                    filler(),
                    switchInput({
                        model,
                        bind: 'enableTerminate',
                        label: 'Danger mode',
                        alignIndicator: 'right'
                    }),
                    button({
                        icon: Icon.skull(),
                        text: 'Terminate',
                        intent: 'danger',
                        disabled: !model.enableTerminate,
                        onClick: this.onTerminateClick
                    })
                ),
                items: [
                    hframe(
                        toolbar({
                            vertical: true,
                            width: 42,
                            items: [
                                filler(),
                                button({icon: Icon.contact()}),
                                button({icon: Icon.comment()}),
                                toolbarSep(),
                                button({icon: Icon.add()}),
                                button({icon: Icon.delete()}),
                                toolbarSep(),
                                button({icon: Icon.gears()}),
                                filler()
                            ]
                        }),
                        hframe({
                            padding: 10,
                            item: 'Help, I am surrounded by toolbars!'
                        }),
                        toolbar({
                            vertical: true,
                            width: 42,
                            items: [
                                button({icon: Icon.contact()})
                            ]
                        })
                    )
                ],
                bbar: toolbar(
                    filler(),
                    select({
                        model,
                        bind: 'state',
                        options: usStates,
                        placeholder: 'Select a State...'
                    }),
                    button({
                        text: 'Show Toast',
                        onClick: this.onShowToastClick
                    })
                )
            })
        });
    }

    onTerminateClick = () => {
        XH.toast({message: 'Game over!', icon: Icon.skull(), intent: 'danger'});
    }

    onShowToastClick = () => {
        XH.toast({
            message: `Currently selected State: ${this.toolBarModel.state || 'None'}`
        });
    }
}