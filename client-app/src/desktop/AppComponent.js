/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, tabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {vframe, frame} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {ContextMenuSupport, ContextMenuItem} from '@xh/hoist/desktop/cmp/contextmenu';

import './App.scss';

@HoistComponent()
@ContextMenuSupport
export class AppComponent extends Component {

    render() {
        return vframe(
            this.renderNavBar(),
            this.renderBody()
        );
    }

    getContextMenuItems() {
        const Item = ContextMenuItem;
        return [Item.reloadApp(), Item.about(), Item.logout()];
    }

    //------------------
    // Implementation
    //------------------
    renderNavBar() {
        return appBar({
            icon: Icon.boxFull({size: '2x'}),
            leftItems: [
                tabSwitcher({model: this.model.tabModel})
            ],
            hideRefreshButton: true
        });
    }

    renderBody() {
        return frame({
            cls: 'toolbox-app-frame',
            item: tabContainer({
                model: this.model.tabModel,
                switcherPosition: 'none'
            })
        });
    }

}