/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {demoPanel} from './DemoPanel';
import './DemoPanel.scss';

@HoistComponent
export class MiscPanel extends Component {

    render() {
        return demoPanel({
            description: [
                <p>
                    Hoist provides access to its built in services and information about the app.
                </p>,
                <p>
                    For more information, please see <a target="#" href="https://github.com/exhi/hoist-react/blob/develop/core/XH.js">XH</a>.
                </p>
            ],
            title: 'Misc',
            height: 400,
            width: 700,
            rows: [
                {
                    xhCode: 'XH.showFeedbackDialog()',
                    description: 'Show a dialog to elicit feedback text from users.'
                },
                {
                    xhCode: 'XH.showAboutDialog()',
                    description: 'Show \'about\' dialog with info about the app and environment.'
                },
                {
                    xhCode: 'XH.toggleTheme()',
                    description: 'Toggle the theme between light and dark variants.'
                },
                {
                    xhCode: 'XH.reloadApp()',
                    description: 'Trigger a full reload of the app.'
                },
                {
                    xhCode: "XH.navigate('default.home')",
                    description: 'Route the app - shortcut to this.router.navigate'
                }
            ]
        });
    }
}