/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common';
import {p, div, table, tr, td, tbody, vbox, code, span, ul, li} from '@xh/hoist/cmp/layout';
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
            minimal: false,
            flex: 1,
            margin: 0
        });
    };

    row = (col1, col2, col3) => {
        return tr(
            td(col1), td(col2), td(col3)
        );
    };

    promiseToast = (returnedBoolean) => XH.toast({
        message: span('That popup resolved to ', code(`${returnedBoolean}`)),
        containerRef: this.divRef.value
    });


    render() {
        const {buttonAppearance, row, promiseToast} = this;

        return wrapper({
            description: div(
                p('Popups are quick ways to notify the user of important information.  Here are just a few examples of our popups:')
            ),
            item: vbox({
                className: 'toolbox-popups-vframe',
                ref: this.divRef.ref,
                item: table(tbody(
                    row(
                        button({
                            ...buttonAppearance(Icon.warning()),
                            text: 'Alert',
                            onClick: () => XH.alert({
                                title: 'Just a vanilla Alert',
                                message: 'This is an alert.  Alerts come with one button: "OK"'
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.warning()),
                            text: 'Alert w/ custom Button',
                            onClick: () => XH.alert({
                                title: 'Alert Title',
                                message: 'This is also an alert.  Here, we customized the text in the button.',
                                confirmText: 'COOL BUTTON!'

                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.warning()),
                            text: 'Alert w/ callback',
                            onClick: () => XH.alert({
                                title: 'Alert Title',
                                message: p('Alerts return a promise that resolves to ', code('true'),
                                    ' when user acknowledges the Alert'
                                )
                            }).then(promiseToast)
                        })
                    ),
                    row(
                        button({
                            ...buttonAppearance(Icon.questionCircle()),
                            text: 'Confirm',
                            onClick: () => XH.confirm({
                                title: 'Just a vanilla Confirm',
                                message: 'This is a confirm. Confirms come with two buttons: "OK" and "Cancel"'
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.questionCircle()),
                            text: 'Confirm w/ custom Button',
                            onClick: () => XH.confirm({
                                title: 'Confirm Title',
                                message: 'This is also a confirm. Like Alerts, we can also customize ' +
                                    'the text inside our buttons.',
                                confirmText: 'Nice',
                                cancelText: 'Nope'
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.questionCircle()),
                            text: 'Confirm w/ callback',
                            onClick: () => XH.confirm({
                                title: 'Confirm Title',
                                message: p('Confirms promises resolve to ', code('true'), ' if user confirms, or ',
                                    code('false'), ' if user cancels.')
                            }).then(promiseToast)
                        })
                    ),
                    row(
                        button({
                            ...buttonAppearance(Icon.comment()),
                            text: 'Message',
                            onClick: () => XH.message({
                                title: 'Message Title',
                                message: div(
                                    p('Messages are highly configurable. (Alerts and Confirms are just preconfigured Messages).'),
                                    p('Dev Beware: without ', code('confirmText'), ' or ', code('cancelText'),
                                        ', Messages will have no buttons!')
                                ),
                                confirmText: 'Oh I see!',
                                cancelText: 'Nope, no seas here.'
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.comment()),
                            text: 'Message w/ adv configs',
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
                            ...buttonAppearance(Icon.comment()),
                            text: 'Message w/ callback',
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
                            ...buttonAppearance(Icon.toast()),
                            text: 'Toast',
                            onClick: () => XH.toast({
                                message: 'This is a toast. Bottom right by default.'
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.toast()),
                            text: 'Toast w/ custom timeout',
                            onClick: () => XH.toast({
                                message: span('This is a toast has a ', code('timeout: 1000'), '. See ya!'),
                                timeout: 1000
                            })
                        }),
                        button({
                            ...buttonAppearance(Icon.toast()),
                            text: 'Toast, anchored',
                            onClick: () => XH.toast({
                                message: span('This is a Toast anchored using ', code('containerRef')),
                                containerRef: this.divRef.value
                            })
                        })
                    ),
                    row(
                        button({
                            ...buttonAppearance(Icon.toast()),
                            text: 'Toast, position',
                            onClick: () => XH.toast({
                                message: span('This is a Toast anchored using ', code('containerRef')),
                                position: 'RIGHT_TOP'
                            })
                        })
                    )
                ))
            })
        });
    }
}