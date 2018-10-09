/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel/index';
import {wrapper} from '../../../common/index';
import {table, tbody, tr, th, thead, div} from '@xh/hoist/cmp/layout/index';
import {tableRow} from './TableRow';
import './DemoPanel.scss';

@HoistComponent
export class MessagesPanel extends Component {

    render() {
        return wrapper({
            description: [
                <p>
                    XH.message(), XH.alert(), and XH.confirm() display modal dialogs.
                    XH.toast() displays an automatically disappearing notification.
                </p>,
                <p>
                    You can control the behavior of each by passing it an options object.
                    Click the button next to each options object to see how it changes the handler's behavior.
                </p>,
                <p>
                    For more information, please see <a target="#" href="https://github.com/exhi/hoist-react/blob/develop/core/XH.js">XHClass</a>.
                </p>
            ],
            item: panel({
                title: 'Messages/Toasts',
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
                                        xhCode: `XH.message({
                                        message: 'This is an XH Message.'
                                        })`,
                                        description: 'XH.message(): Modal dialog with no default button text'
                                    }),
                                    tableRow({
                                        xhCode: `XH.message({
                                            message:'Where would you like to go?',
                                            confirmText:'Stay here',
                                            cancelText:'Home page',
                                            onCancel: () => XH.navigate('default.home')
                                            })`,
                                        description: 'Message with text defined for both confirm and cancel buttons. ' +
                                            'The cancel button receives a callback which accesses the app\'s router via XH.navigate().'
                                    }),
                                    tableRow({
                                        xhCode: `XH.alert({
                                            message: 'This is an XH Alert.'
                                            })`,
                                        description: 'XH.alert(): Modal dialog with default confirm button text \'OK\''
                                    }),
                                    tableRow({
                                        xhCode: `XH.alert({
                                            message: 'Hey! Check out these new features',
                                            title: 'XH Alert',
                                            confirmIntent: 'primary'
                                            })`,
                                        description: 'XH alert with a title and a Blueprint intent set on its confirm button'
                                    }),
                                    tableRow({
                                        xhCode: `XH.confirm({
                                            message:'This is an XH Confirm.'
                                            })`,
                                        description: 'XH.confirm(): Modal dialog with default \'OK\' and \'Cancel\' buttons'
                                    }),
                                    tableRow({
                                        xhCode: `XH.confirm({
                                            message:'Would you like to write to the console?',
                                            onConfirm: () => console.log('Hello world')
                                            })`,
                                        description: 'XH confirm with a callback which executes when the confirm button is clicked'
                                    }),
                                    tableRow({
                                        xhCode: `XH.toast({
                                            message:'This is a simple XH toast.'
                                            })`,
                                        description: 'Notification which disappears after 3 seconds (default)'
                                    }),
                                    tableRow({
                                        xhCode: `XH.toast({
                                            message:'This is a less simple XH toast',
                                            timeout:'5000',
                                            intent:'warning',
                                            position:'auto'
                                            })`,
                                        description: 'Notification which automatically disappears after' +
                                          ' 5 seconds. Blueprint\'s \'intent\' and \'position\' props set to \'warning\'' +
                                          ' and \'auto\', respectively'
                                    })
                                )
                            ]
                        })
                    })
            })
        });
    }
}
