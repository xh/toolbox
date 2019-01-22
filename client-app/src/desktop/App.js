import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, tabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {ContextMenuSupport, ContextMenuItem} from '@xh/hoist/desktop/cmp/contextmenu';

import './App.scss';

@HoistComponent
@ContextMenuSupport
export class App extends Component {

    render() {
        const {tabModel} = this.model;

        return panel({
            tbar: appBar({
                icon: Icon.boxFull({size: '2x', prefix: 'fal'}),
                title: 'Hoist React Toolbox',
                leftItems: [
                    tabSwitcher({model: tabModel})
                ],
                hideRefreshButton: false
            }),
            className: 'toolbox-app-frame',
            item: tabContainer({
                model: tabModel,
                switcherPosition: 'none'
            })
        });
    }

    getContextMenuItems() {
        const Item = ContextMenuItem;
        return [Item.reloadApp(), Item.about(), Item.logout()];
    }

}