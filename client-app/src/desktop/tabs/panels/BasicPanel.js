import {Component} from 'react';
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
            description: `
                Panels support a number of important and frequent layout tasks. They include a header bar with a standard icon, title, and header items. They accept props to create docked top and and bottom toolbars. Panel content is limited to your imagination, but most often contains grids or charts or other panels. See the other Panel tabs for more complex panel examples and more panel features.
            `,
            item: panel({
                icon: Icon.window(),
                title: 'Panels › Basic Panel',
                height: 400,
                width: 700,
                tbar: toolbar(
                    filler(),
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