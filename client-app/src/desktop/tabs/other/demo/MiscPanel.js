/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel/index';
import {wrapper} from '../../../common/index';
import {table, tbody, tr, th, thead} from '@xh/hoist/cmp/layout/index';
import {tableRow} from './TableRow';
import './DemoPanel.scss';
import React from 'react';

@HoistComponent
export class MiscPanel extends Component {

    FEEDBACK = 'XH.showFeedbackDialog()';
    ABOUT = 'XH.showAboutDialog()';
    TOGGLE = 'XH.toggleTheme()';

    render() {
        return wrapper({
            description: [
                <p>
                    Hoist provides access to its built in services and information about the app.
                </p>,
                <p>
                    For more information, please see <a target="#" href="https://github.com/exhi/hoist-react/blob/develop/core/XH.js">XHClass</a>.
                </p>
            ],
            item: panel({
                title: 'Other XH actions',
                height: 300,
                width: 700,
                className: 'toolbox-demo-panel',
                item: table({
                    className: 'xh-table',
                    items: [
                        thead(
                            tr(
                                th(''), th('Code'), th('Description')
                            )
                        ),
                        tbody(
                            tableRow({
                                xhCode: 'XH.showFeedbackDialog()',
                                description: 'Show a dialog to elicit feedback text from users.'
                            }),
                            tableRow({
                                xhCode: 'XH.showAboutDialog()',
                                description: 'Show \'about\' dialog with info about the app and environment.'
                            }),
                            tableRow({
                                xhCode: 'XH.toggleTheme()',
                                description: 'Toggle the theme between light and dark variants.'
                            }),
                            tableRow({
                                xhCode: 'XH.reloadApp()',
                                description: 'Trigger a full reload of the app.'
                            }),
                            tableRow({
                                xhCode: "XH.navigate('default.home')",
                                description: 'Route the app - shortcut to this.router.navigate'
                            })
                        )
                    ]
                })
            })
        });
    }
}