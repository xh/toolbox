/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {tr, th} from '@xh/hoist/cmp/layout/index';
import {demoPanel} from './DemoPanel';

@HoistComponent
export class MessagesPanel extends Component {

    render() {
        return demoPanel({
            description: [
                <p>
                    XH.message(), XH.alert(), and XH.confirm() display modal dialogs.
                    XH.toast() displays an automatically disappearing notification.
                </p>,
                <p>
                    You can pass a message or toast an options object.
                    Click on a button to see how each option controls the component's behavior.
                </p>,
                <p>
                    For more information, please see <a target="#" href="https://github.com/exhi/hoist-react/blob/develop/core/XH.js">XH</a>.
                </p>
            ],
            title: 'Messages/Toasts',
            height: '75%',
            width: '90%',
            rows: [
                tr(th(''), th('XH.message()'), th('Display a modal dialog with no default buttons')),
                {
                    xhCode: `XH.message({\n\tmessage:'Where would you like to go?',\n\tconfirmText:'Stay here',\n\tcancelText:'Home page',\n\tonCancel: () => XH.navigate('default.home')\n})`,
                    description: 'Text defined for both confirm and cancel buttons. ' +
                        'The cancel button receives a callback which accesses the app\'s router via XH.navigate().'
                },
                tr(th(''), th('XH.alert()'), th(`Modal dialog with default text 'OK' on confirm button.`)),
                {
                    xhCode: `XH.alert({\n\tmessage: 'This is an XH Alert.'\n})`,
                    description: 'No optional parameters set'
                },
                {
                    xhCode: `XH.alert({\n\tmessage: 'Hey! Check out these new features',\n\ttitle: 'XH Alert',\n\tconfirmIntent: 'primary'\n})`,
                    description: 'Title added, blueprint intent set on confirm button'
                },
                tr(th(''), th('XH.confirm()'), th(`Modal dialog with default text 'OK'/'Cancel' on confirm/cancel buttons`)),
                {
                    xhCode: `XH.confirm({\n\tmessage:'This is an XH Confirm.'\n})`,
                    description: 'No optional parameters set'
                },
                {
                    xhCode: `XH.confirm({\n\tmessage:'Would you like to write to the console?',\n\tonConfirm: () => console.log('Hello world')\n})`,
                    description: 'Confirm button receives a callback which executes when clicked'
                },
                tr(th(''), th('XH.toast()'), th('Notification which disappears after 3 seconds by default')),
                {
                    xhCode: `XH.toast({\n\tmessage:'This is a simple XH toast.'\n})`,
                    description: 'No optional parameters set'
                },
                {
                    xhCode: `XH.toast({\n\tmessage:'This is a less simple XH toast',\n\ttimeout:'5000',\n\tintent:'warning',\n\tposition:'auto'\n})`,
                    description: `Disappears after 5 seconds. Receives two Blueprint props: 'intent' and 'position'`
                }
            ]
        })
    }
}
