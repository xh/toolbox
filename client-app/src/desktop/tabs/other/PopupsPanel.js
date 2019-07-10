/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {box, code, div, li, p, span, table, tbody, td, th, tr, ul} from '@xh/hoist/cmp/layout';
import {HoistComponent, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {textArea} from '@xh/hoist/desktop/cmp/input';
import {required, lengthIs} from '@xh/hoist/cmp/form';
import {Icon} from '@xh/hoist/icon';
import {Ref} from '@xh/hoist/utils/react';
import React, {Component} from 'react';
import {wrapper} from '../../common';

import './PopupsPanel.scss';

@HoistComponent
export class PopupsPanel extends Component {

    divRef = new Ref();

    render() {
        const {popBtn, row, promiseToast, acceptRichTextReminder} = this;

        return wrapper({
            description: (
                <div>
                    <p>Popups notify users about important events or prompt them to confirm an action.</p>
                    <p>
                        The <code>Message</code> component supports for modal alerts in Hoist,
                        but is not typically used directly by an application. Instead,
                        the <code>XH.message()</code>, <code>XH.alert()</code>, <code>XH.confirm()</code>,
                        and <code>XH.prompt()</code> methods provide convenient APIs for apps to
                        trigger the display of Messages.
                    </p>
                    <p>For non-modal notifications, consider using <code>XH.toast()</code>.</p>
                </div>
            ),
            item: box({
                className: 'tbox-popups',
                ref: this.divRef.ref,
                item: table(tbody(
                    row(
                        button({
                            ...popBtn(Icon.warning({className: 'xh-red'})),
                            text: 'Alert',
                            onClick: () => XH.alert({
                                title: 'Alert',
                                message: div(
                                    p('This is an Alert. Alerts come with one button: "OK"'),
                                    acceptRichTextReminder
                                )
                            })
                        }),
                        button({
                            ...popBtn(Icon.warning({className: 'xh-red-muted'})),
                            text: 'with custom button',
                            onClick: () => XH.alert({
                                title: 'Alert with custom button',
                                message: (
                                    <p>
                                        This is also an Alert. Here, we customized the text and color of the button
                                        with <code>confirmText</code> and <code>confirmIntent</code>.
                                    </p>
                                ),
                                confirmText: 'COOL BUTTON!',
                                confirmIntent: 'warning'
                            })
                        }),
                        button({
                            ...popBtn(Icon.warning({className: 'xh-red-muted'})),
                            text: 'as promise',
                            onClick: () => XH.alert({
                                title: 'Alert with callback',
                                message: p('Alert return a promise that resolves to true when acknowledged.')
                            }).then(promiseToast)
                        })
                    ),
                    row(
                        button({
                            ...popBtn(Icon.questionCircle({className: 'xh-blue-dark'})),
                            text: 'Confirm',
                            onClick: () => XH.confirm({
                                title: 'Confirm',
                                message: div(
                                    p('This is a confirm. Confirms come with two buttons: "OK" and "Cancel"'),
                                    acceptRichTextReminder
                                )
                            })
                        }),
                        button({
                            ...popBtn(Icon.questionCircle({className: 'xh-blue-muted'})),
                            text: 'with custom button',
                            onClick: () => XH.confirm({
                                title: 'Confirm with custom buttons',
                                message: (
                                    <p>
                                        This is also a Confirm. Here, we customized the text and color of the buttons
                                        with <code>confirmText</code>, <code>confirmIntent</code>, <code>cancelText</code>, and <code>cancelIntent</code>.
                                    </p>
                                ),
                                confirmText: 'Nice',
                                confirmIntent: 'primary',
                                cancelText: 'Nope',
                                cancelIntent: 'danger'
                            })
                        }),
                        button({
                            ...popBtn(Icon.questionCircle({className: 'xh-blue-muted'})),
                            text: 'as promise',
                            onClick: () => XH.confirm({
                                title: 'Confirm with promise',
                                message: p('Confirm returns a promise that resolves to true if the user confirms or false if the user cancels.')
                            }).then(promiseToast)
                        })
                    ),
                    row(
                        button({
                            ...popBtn(Icon.edit({className: 'xh-blue-light'})),
                            text: 'Prompt',
                            onClick: () => XH.prompt({
                                title: 'Just a vanilla Prompt',
                                message: div(
                                    p('This is a prompt. Prompt comes with two buttons: "OK" and "Cancel"'),
                                    acceptRichTextReminder
                                )
                            })
                        }),
                        button({
                            ...popBtn(Icon.edit({className: 'xh-blue-light'})),
                            text: 'with customizations',
                            onClick: () => XH.prompt({
                                title: 'Prompt Title',
                                message: p(
                                    'This is also a Prompt.  Here, we customized the input with ', code('input'),
                                    ', and the text and color of the buttons with ',
                                    code('confirmText'), ', ', code('confirmIntent'), ', ',
                                    code('cancelText'), ', ', code('cancelText')
                                ),
                                input: {
                                    value: 'Hello world...',
                                    item: textArea({autoFocus: true}),
                                    rules: [required, lengthIs({min: 20})]
                                },
                                confirmText: 'Submit',
                                confirmIntent: 'primary',
                                cancelText: 'Nope',
                                cancelIntent: 'danger'
                            })
                        }),
                        button({
                            ...popBtn(Icon.edit({className: 'xh-blue-light'})),
                            text: 'as promise',
                            onClick: () => XH.prompt({
                                title: 'Prompt with promise',
                                message: p('Prompt return a promise that resolves to the input\'s ', code('value'), ' if user confirms, or ',
                                    code('false'), ' if user cancels.')
                            }).then(promiseToast)
                        })
                    ),
                    row(
                        button({
                            ...popBtn(Icon.comment({className: 'xh-green'})),
                            text: 'Message',
                            onClick: () => XH.message({
                                title: 'Message',
                                message: div(
                                    <p>Messages are highly configurable - Alerts and Confirms are simply preconfigured Messages.</p>,
                                    <p>Note, without <code>confirmText</code> or <code>cancelText</code>, the displayed Message will have no buttons!</p>,
                                    acceptRichTextReminder
                                ),
                                confirmText: 'Oh I see!',
                                cancelText: 'Nope, no seas here.'
                            })
                        }),
                        button({
                            ...popBtn(Icon.comment({className: 'xh-green-muted'})),
                            text: 'with callbacks',
                            onClick: () => XH.message({
                                title: 'Message with callbacks',
                                message: (
                                    <p>
                                        You can also pass a function to Message, Alert, and Confirm via
                                        the <code>onCancel</code> and <code>onConfirm</code> callback configs.
                                    </p>
                                ),
                                confirmText: 'Got it',
                                cancelText: 'Cancel',
                                onConfirm: () => XH.toast({
                                    message: <span>Called <code>onConfirm</code></span>,
                                    containerRef: this.divRef.value
                                }),
                                onCancel: () => XH.toast({
                                    message: <span>Called <code>onCancel</code></span>,
                                    icon: Icon.x(),
                                    intent: 'danger',
                                    containerRef: this.divRef.value
                                })
                            })
                        }),
                        button({
                            ...popBtn(Icon.comment({className: 'xh-green-muted'})),
                            text: 'as promise',
                            onClick: () => XH.message({
                                title: 'Message with promise',
                                message: div(
                                    p('Messages, Alerts, and Confirms all return a promise...'),
                                    ul(
                                        li('Alert promises resolve to true when user acknowledges alert. '),
                                        li('Confirm and Message promises resolve to true if user confirms, or false if user cancels.')
                                    )
                                ),
                                confirmText: 'Cool',
                                cancelText: 'Cancel'
                            }).then(promiseToast)
                        })
                    ),
                    row(
                        button({
                            ...popBtn(Icon.toast({className: 'xh-orange'})),
                            text: 'Toast',
                            onClick: () => XH.toast({
                                message: 'This is a Toast. Bottom right of app by default.'
                            })
                        }),
                        button({
                            ...popBtn(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with custom timeout',
                            onClick: () => XH.toast({
                                message: span('This is a Toast has a ', code('timeout: 1000'), '. See ya!'),
                                timeout: 1000
                            })
                        }),
                        button({
                            ...popBtn(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with containerRef',
                            onClick: () => XH.toast({
                                message: span('This is a Toast anchored using ', code('containerRef')),
                                containerRef: this.divRef.value
                            })
                        })
                    ),
                    row('',
                        button({
                            ...popBtn(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with position',
                            onClick: () => XH.toast({
                                position: 'top-center',
                                message: span('This is a Toast with ', code('position: top-center'))
                            })
                        }),
                        button({
                            ...popBtn(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with intent + icon',
                            onClick: () => XH.toast({
                                message: span('This is a Toast with ', code("intent: 'danger'")),
                                icon: Icon.skull(),
                                intent: 'danger'
                            })
                        })
                    )
                ))
            })
        });
    }

    popBtn = (icon) => {
        return ({
            className: 'tbox-popups__button',
            icon: icon,
            minimal: false
        });
    };

    row = (col1, col2, col3) => {
        return tr(th(col1), td(col2), td(col3));
    };

    promiseToast = (returnedBoolean) => XH.toast({
        message: span('That popup resolved to ', code(`${returnedBoolean}`)),
        intent: returnedBoolean ? 'success' : 'danger',
        icon: returnedBoolean ? Icon.check() : Icon.x(),
        containerRef: this.divRef.value
    });

    acceptRichTextReminder = p('Good to know: ', code('Alert'), ', ', code('Confirm'), ', ', code('Prompt'),
        ', and ', code('Message'), ' can display rich text by accepting strings, JSX, and React elements. '
    );
}