/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {elemFactory, hoistComponent, XH} from 'hoist/core';
import {feedbackDialog, logoutButton, launchAdminButton, refreshButton, resizable, themeToggleButton, toolbar} from 'hoist/cmp';
import {wait} from 'hoist/promise';
import {box, hframe, hspacer, vframe} from 'hoist/layout';
import {button, navbar, navbarGroup, navbarHeading} from 'hoist/kit/blueprint';
import {Icon} from 'hoist/icon';

import './App.scss';

@hoistComponent()
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
                    Icon.portfolio({size: '2x'}),
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
                    logoutButton(),
                    refreshButton({
                        intent: 'success',
                        onClick: this.onRefreshClick
                    })
                ]
            })
        );
    }

    renderBody() {
        return vframe('Toolbox!');
    }

    onFeedbackClick = () => {
        this.model.feedbackModel.open();
    }

    onRefreshClick = () => {
        // "Fake" a reload here - we know data isn't going to change
        wait(500).linkTo(XH.appLoadModel);
    }

}
export const app = elemFactory(App);