/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common';
import {p, div, table, tr, th, td, tbody, vbox, code, span, ul, li} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {Ref} from '@xh/hoist/utils/react';

import './PopupsPanel.scss';

@HoistComponent
export class PopupsPanel extends Component {

    divRef = new Ref();

    buttonAppearance = (icon) => {
        return ({
            className: 'toolbox-popups-button',
            icon: icon,
            minimal: false
        });
    };

    row = (col1, col2, col3) => {
        return tr(
            th(col1), td(col2), td(col3)
        );
    };

    promiseToast = (returnedBoolean) => XH.toast({
        message: span('That popup resolved to ', code(`${returnedBoolean}`)),
        containerRef: this.divRef.value
    });

    acceptRichTextReminder = p('Good to know: ', code('Alert'), ', ', code('Confirm'), ', and ', code('Message'),
        ' can display rich text by accepting strings, JSX, and React elements. '
    );

    render() {
        const {buttonAppearance, row, promiseToast, acceptRichTextReminder} = this;

        return wrapper({
            description: div(
                p('Popups are interactive ways to notify users about important information.  They can also be used to ',
                    'confirm a decision with users. '),
                p(code('Message'), 's provide modal dialogs to the user, and ',
                    code('Alert'), ' and ', code('Confirm'), ' are preconfigured ', code('Message'), 's. Use ',
                    code('Toast'), ' for non-modal notifications.'),
                p('See ', code('XH.alert'), ', ', code('XH.confirm'), ', ', code('XH.message'), ', ', code('XH.toast'), '.'),
                p('Here are just a few examples of our popups:')
            ),
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/PopupsPanel.js#L88',
                    text: 'PopupsPanel.js'
                },
                {
                    url: '$HR/core/XH.js#L290',
                    text: 'XH.js',
                    notes: 'Messages, Confirms, Alerts, and Toasts'
                },
                {
                    url: '$TB/client-app/src/desktop/tabs/examples/recalls/RecallsPanel.js#L54',
                    text: 'RecallsPanel.js',
                    notes: 'Alert Example'
                },
                {
                    url: '$TB/client-app/src/desktop/common/SampleGrid.js#L240',
                    text: 'SampleGrid.js',
                    notes: 'Toast Example'
                }
            ],
            item: vbox({
                className: 'toolbox-popups-vframe',
                ref: this.divRef.ref,
                item: table(tbody(
                    row(
                        button({
                            ...buttonAppearance(Icon.warning({className: 'xh-red'})),
                            text: 'Alert',
                            onClick: () => XH.alert({
                                title: 'Just a vanilla Alert',
                                message: div(
                                    p('This is an Alert.  Alerts come with one button: "OK"'),
                                    acceptRichTextReminder
                                )
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.warning({className: 'xh-red-muted'})),
                            text: 'with custom button',
                            onClick: () => XH.alert({
                                title: 'Alert Title',
                                message: p(
                                    'This is also an Alert.  Here, we customized the text and color of the button with ',
                                    code('confirmText'), ' and ', code('confirmIntent')
                                ),
                                confirmText: 'COOL BUTTON!',
                                confirmIntent: 'warning'

                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.warning({className: 'xh-red-muted'})),
                            text: 'with callback',
                            onClick: () => XH.alert({
                                title: 'Alert Title',
                                message: p('Alert return a promise that resolves to ', code('true'),
                                    ' when user acknowledges the Alert'
                                )
                            }).then(promiseToast)
                        })
                    ),
                    row(
                        button({
                            ...buttonAppearance(Icon.questionCircle({className: 'xh-blue-dark'})),
                            text: 'Confirm',
                            onClick: () => XH.confirm({
                                title: 'Just a vanilla Confirm',
                                message: div(
                                    p('This is a confirm. Confirm come with two buttons: "OK" and "Cancel"'),
                                    acceptRichTextReminder
                                )
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.questionCircle({className: 'xh-blue-muted'})),
                            text: 'with custom button',
                            onClick: () => XH.confirm({
                                title: 'Confirm Title',
                                message: p(
                                    'This is also a Confirm.  Here, we customized the text and color of the buttons with ',
                                    code('confirmText'), ', ', code('confirmIntent'), ', ',
                                    code('cancelText'), ', ', code('cancelText')
                                ),
                                confirmText: 'Nice',
                                confirmIntent: 'primary',
                                cancelText: 'Nope',
                                cancelIntent: 'danger'
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.questionCircle({className: 'xh-blue-muted'})),
                            text: 'with callback',
                            onClick: () => XH.confirm({
                                title: 'Confirm Title',
                                message: p('Confirm return a promise that resolves to ', code('true'), ' if user confirms, or ',
                                    code('false'), ' if user cancels.')
                            }).then(promiseToast)
                        })
                    ),
                    row(
                        button({
                            ...buttonAppearance(Icon.comment({className: 'xh-green'})),
                            text: 'Message',
                            onClick: () => XH.message({
                                title: 'Message Title',
                                message: div(
                                    p('Messages are highly configurable. (Alerts and Confirms are just preconfigured Messages).'),
                                    p('Dev Beware: without ', code('confirmText'), ' or ', code('cancelText'),
                                        ', Messages will have no buttons!'),
                                    acceptRichTextReminder
                                ),
                                confirmText: 'Oh I see!',
                                cancelText: 'Nope, no seas here.'
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.comment({className: 'xh-green-muted'})),
                            text: 'with advanced configs',
                            onClick: () => XH.message({
                                title: 'Message Title',
                                message: p(
                                    'This is a message.  You can also pass a function to Message, Alert, and Confirm via the ',
                                    code('onCancel'), ' or ', code('onConfirm'), ' config.'
                                ),
                                confirmText: 'Got it',
                                cancelText: 'Come again?',
                                onConfirm: () => XH.toast({
                                    message: span(code('onConfirm'), ' called!'),
                                    containerRef: this.divRef.value
                                }),
                                onCancel: () => XH.toast({
                                    message: span(code('onCancel'), ' called!'),
                                    containerRef: this.divRef.value
                                })
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.comment({className: 'xh-green-muted'})),
                            text: 'with callback',
                            onClick: () => XH.message({
                                title: 'Message Title',
                                message: div(
                                    p('Messages, Alerts, and Confirms all return a promise...'),
                                    ul(
                                        li('Alert promises resolve to true when user acknolwedges alert. '),
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
                            ...buttonAppearance(Icon.toast({className: 'xh-orange'})),
                            text: 'Toast',
                            onClick: () => XH.toast({
                                message: 'This is a Toast. Bottom right of app by default.'
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with custom timeout',
                            onClick: () => XH.toast({
                                message: span('This is a Toast has a ', code('timeout: 1000'), '. See ya!'),
                                timeout: 1000
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with containerRef',
                            onClick: () => XH.toast({
                                message: span('This is a Toast anchored using ', code('containerRef')),
                                containerRef: this.divRef.value
                            })
                        })
                    ),
                    row('',
                        button({
                            ...buttonAppearance(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with position',
                            onClick: () => XH.toast({
                                position: 'top-left',
                                message: span('This is a Toast with ', code('position: top-left'))
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with intent',
                            onClick: () => XH.toast({
                                message: span('This is a Toast with ', code("intent: 'danger'")),
                                intent: 'danger'
                            })
                        })
                    )
                ))
            })
        });
    }
}