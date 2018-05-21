/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {button, navbar, navbarGroup, navbarHeading} from '@xh/hoist/kit/blueprint';
import {HoistComponent, XH} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {logoutButton, launchAdminButton, themeToggleButton} from '@xh/hoist/cmp/button';
import {feedbackDialog} from '@xh/hoist/cmp/feedback';
import {vframe, frame} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

import './App.scss';

@HoistComponent()
export class App extends Component {

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
        return navbar(
            navbarGroup({
                align: 'left',
                items: [
                    Icon.boxFull({size: '2x'}),
                    navbarHeading(XH.appName)
                ]
            }),
            navbarGroup({
                align: 'right',
                items: [
                    button({
                        icon: Icon.comment(),
                        onClick: this.onFeedbackClick
                    }),
                    themeToggleButton(),
                    launchAdminButton(),
                    logoutButton()
                ]
            })
        );
    }

    renderBody() {
        return frame({
            cls: 'xh-toolbox-app-frame',
            item: tabContainer({model: XH.appModel.tabs})
        });
    }

    onFeedbackClick = () => {
        this.model.feedbackModel.open();
    }

}