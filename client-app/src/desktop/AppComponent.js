/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {button} from '@xh/hoist/kit/blueprint';
import {HoistComponent, XH} from '@xh/hoist/core';
import {tabContainer, tabSwitcher} from '@xh/hoist/cmp/tab';
import {feedbackDialog} from '@xh/hoist/cmp/feedback';
import {vframe, frame} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {appBar} from '@xh/hoist/cmp/appbar';

import './App.scss';

@HoistComponent()
export class AppComponent extends Component {

    render() {
        return vframe(
            this.renderNavBar(),
            this.renderBody(),
            feedbackDialog({model: this.model.feedbackModel})
        );
    }

    //------------------
    // Implementation
    //------------------
    renderNavBar() {
        return appBar({
            icon: Icon.boxFull({size: '2x'}),
            leftItems: [
                tabSwitcher({model: XH.app.tabs})
            ],
            rightItems: [
                button({
                    icon: Icon.comment(),
                    onClick: this.onFeedbackClick
                })
            ],
            hideRefreshButton: true
        });
    }

    renderBody() {
        return frame({
            cls: 'xh-toolbox-app-frame',
            item: tabContainer({model: XH.app.tabs})
        });
    }

    onFeedbackClick = () => {
        this.model.feedbackModel.open();
    }

}