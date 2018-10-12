/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core/index';
import {demoPanel, tableRow} from './DemoPanel';


@HoistComponent
export class ExceptionsPanel extends Component {
    render() {
        return demoPanel({
            description: [
                <p>
                    Hoist provides exception handling out of the box with XH.handleException().
                    handleException() receives two arguments, and error or string and an options object.
                    The options object controls user alerts and logging.
                </p>,
                <p>
                    For error handling in asynchronous code, Hoist exposes the Promise.catchDefault() method.
                    It is commonly chained to a fetch request, and also receives an error and options object.
                </p>,
                <p>For more information, please see the <a target="#" href="https://github.com/exhi/hoist-react/blob/develop/core/ExceptionHandler.js">ExceptionHandler</a> class.
                </p>
            ],
            title: 'Exception Handling',
            height: '70%',
            width: '90%',
            rows: [
                {
                    xhCode:`XH.handleException('Error', {\n\tmessage: 'Stop doing that!', \n\ttitle: 'I am an XH Error Message'\n})`,
                    description: 'Override the default error message and add a title to the modal dialog'
                },
                {
                    xhCode: `XH.handleException('Error', {\n\tlogOnServer: false\n})`,
                    description: 'Don\'t send the exception to the server to be stored in DB. See' +
                        ' /admin/activity/clientErrors'
                },
                {
                    xhCode: `XH.handleException('Error', {\n\tshowAlert: false\n})`,
                    description: 'Don\'t display an alert dialog to the user'
                },
                {
                    xhCode: `XH.handleException('Error', {\n\tshowAsError: false\n})`,
                    description: 'Don\'t display to the user as an error.'
                },
                {
                    xhCode: `XH.handleException('Error', {\n\trequireReload: true\n})`,
                    description: 'Force the user to refresh app in order to dismiss the modal',
                }
            ]
        })
    }
}