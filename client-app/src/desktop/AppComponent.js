/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer, tabSwitcher} from '@xh/hoist/desktop/cmp/tab';
import {vframe, frame} from '@xh/hoist/layout';
import {Icon} from '@xh/hoist/icon';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';

import './App.scss';

@HoistComponent()
export class AppComponent extends Component {

    render() {
        return vframe(
            this.renderNavBar(),
            this.renderBody()
        );
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
            cls: 'xh-toolbox-app-frame',
            item: tabContainer({
                model: this.model.tabModel,
                switcherPosition: 'none'
            })
        });
    }

}