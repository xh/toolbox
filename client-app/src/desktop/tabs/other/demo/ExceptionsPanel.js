/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel/index';
import {wrapper} from '../../../common/index';
import {div, table, tbody, tr, th, thead} from '@xh/hoist/cmp/layout/index';
import {tableRow} from './TableRow';


@HoistComponent
export class ExceptionsPanel extends Component {
    render() {
        return wrapper({
            description: [
                <p>
                    Promise.catchDefault() and XH.handleException() can receive an options object.
                    When included in this object, the below values control user alerts and logging.
                    Click the button next to each option to see how it changes the handler's behavior.
                </p>,
                <p>For more information, please see the <a target="#" href="https://github.com/exhi/hoist-react/blob/develop/core/ExceptionHandler.js">ExceptionHandler</a> class.
                </p>
            ],
            item: panel({
                title: 'Exceptions',
                height: '75%',
                width: '90%',
                className: 'toolbox-demo-panel',
                item:
                    div({
                        className: 'demo-table-scroller',
                        item: table({
                            className: 'xh-table',
                            items: [
                                thead(tr(th(''), th('Code'), th('Description'))),
                                tbody(
                                    tableRow({
                                        xhCode: '{message: \'That\'s a mistake!\', title: \'XH Error Title\'}',
                                        description: 'Override the default error message and add a title to the modal dialog',
                                        onClick: () => this.onClick({message: 'That\'s a mistake!', title: 'XH Error Title'})
                                    }),
                                    tableRow({
                                        xhCode: '{logOnServer: false}',
                                        description: 'Don\'t send the exception to the server to be stored in DB. See' +
                                        ' /admin/activity/clientErrors',
                                        onClick: () => this.onClick({logOnServer: false})
                                    }),
                                    tableRow({
                                        xhCode: '{showAlert: false}',
                                        description: 'Don\'t display an alert dialog to the user',
                                        onClick: () => this.onClick({showAlert: false})
                                    }),
                                    tableRow({
                                        xhCode: '{showAsError: false}',
                                        description: 'Don\'t display to the user as an error.',
                                        onClick: () => this.onClick({showAsError: false})
                                    }),
                                    tableRow({
                                        xhCode: '{requireReload: true}',
                                        description: 'Force the user to refresh app in order to dismiss the modal',
                                        onClick: () => this.onClick({requireReload: true})
                                    }),
                                    tableRow({
                                        xhCode: '{hideParams: [\'password\']}',
                                        description: 'Hide the password param from the exception log and alert',
                                        onClick: () => this.onClick({hideParams: ['password']})
                                    }),
                                    tableRow({
                                        xhCode: '{alertKey: \'test\'}',
                                        description: 'Allow only one dialog to be created with this key. Avoid repeated failure causing a stack of popups.',
                                        onClick: () => this.repeatException({alertKey: 'test'})
                                    })
                                )
                            ]
                        })
                    })
            })
        });
    }

    onClick = async (opts) => {
        return XH.fetchJson({
            url: 'badPath',
            params: {password: 'Password'}
        }).catchDefault(opts);
    }

    repeatException = (opts) => {
        XH.handleException('Test', opts);
        setTimeout(() => XH.handleException('Other', opts), 1000);
    }

}