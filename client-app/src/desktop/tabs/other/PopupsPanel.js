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
import {Ref} from '@xh/hoist/utils/react';

import './PopupsPanel.scss';

@HoistComponent
export class PopupsPanel extends Component {

    divRef = new Ref();

    render() {

        const buttonAppearance = {
            className: 'toolbox-popups-button',
            // icon: Icon.add(),
            minimal: false,
            flex: 1,
            margin: 5
        };
        const row = (col1, col2, col3) => {
            return tr(
                td(col1), td(col2), td(col3)
            );
        };

        return wrapper({
            description: p('here are some popups'),
            item: vbox({
                className: 'toolbox-popups-vframe',
                ref: this.divRef.ref,
                item: table({
                    item: tbody(
                        row(
                            button({
                                ...buttonAppearance,
                                text: 'Alert',
                                onClick: () => XH.alert({
                                    title: 'Alert Title: just a vanilla Alert',
                                    message: 'This is an alert.  Alerts come with one button: "OK"'
                                })
                            }),
                            button({
                                ...buttonAppearance,
                                text: 'Alert w/ custom Button',
                                onClick: () => XH.alert({
                                    title: 'Alert Title',
                                    message: 'This is also an alert.  Here, we customized the text in the button.',
                                    confirmText: 'COOL BUTTON!'

                                })
                            }),
                            button({
                                ...buttonAppearance,
                                text: 'Alert w/ callback',
                                onClick: () => XH.alert({
                                    title: 'Alert Title',
                                    message: p('Alerts return a promise that resolves to ', code('true'),
                                        'when user acknowledges the Alert'
                                    )
                                }).then(() => XH.toast({
                                    message: p('Oh look, a ', code('.then')),
                                    containerRef: this.divRef.value
                                }))
                            })
                        ),
                        row(
                            button({
                                ...buttonAppearance,
                                text: 'Confirm',
                                onClick: () => XH.confirm({
                                    title: 'Confirm Title: just a vanilla Confirm',
                                    message: 'This is a confirm. Confirms come with two buttons: "OK" and "Cancel"'
                                })
                            }),
                            button({
                                ...buttonAppearance,
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
                                ...buttonAppearance,
                                text: 'Confirm w/ callback',
                                onClick: () => XH.confirm({
                                    title: 'Confirm Title',
                                    message: p('Confirms promises resolve to ', code('true'), ' if user confirms, or ',
                                        code('false'), ' if user cancels.')
                                }).then((returnedBoolean) => XH.toast({
                                    message: p('That promise resolved to ', code(`${returnedBoolean}`)),
                                    containerRef: this.divRef.value
                                }))
                            })
                        ),
                        row(
                            button({
                                ...buttonAppearance,
                                text: 'Message',
                                onClick: () => XH.message({
                                    title: 'Message Title',
                                    message: div(
                                        p('Messages are highly configurable. (Alerts and Confirms are just preconfigured Messages).'),
                                        p('Dev Beware: without', code('confirmText'), ' or ', code('cancelText'),
                                            ' Messages will have no buttons!')
                                    ),
                                    confirmText: 'Oh I see!',
                                    cancelText: 'Nope, no seas here.'
                                })
                            }),
                            button({
                                ...buttonAppearance,
                                text: 'Message w/ adv configs',
                                onClick: () => {
                                    XH.message({
                                        title: 'Message Title',
                                        message: p(
                                            'This is a message.  You can also pass a function to Message, Alert, and Confirm via the ',
                                            code('onCancel'), ' or ', code('onConfirm'), ' config.'
                                        ),
                                        confirmText: 'Got it',
                                        cancelText: 'Come again?',
                                        onConfirm: () => XH.toast({
                                            message: p(code('onConfirm'), ' is an alternative to ', code('.then')),
                                            containerRef: this.divRef.value
                                        }),
                                        onCancel: () => XH.toast({
                                            message: p(code('onCancel'), ' is an alternative to ', code('.then')),
                                            containerRef: this.divRef.value
                                        }),
                                    })
                                }
                            }),
                            button({
                                ...buttonAppearance,
                                text: 'Message w/ callback',
                                onClick: () => {
                                    XH.message({
                                        title: 'Message Title',
                                        message: div(
                                            p('Messages, Alerts, and Confirms all return a promise... \n\n'),
                                            ul(
                                                li('Alert promises resolve to true when user acknolwedges alert. '),
                                                li('Confirm and Message promises resolve to true if user confirms, ' +
                                                    'or false if user cancels.')
                                            )
                                        ),
                                        confirmText: 'Cool',
                                        cancelText: 'Cancel'
                                    }).then((returnedBoolean) => XH.toast({
                                        message: p('That promise resolved to ', code(`${returnedBoolean}`)),
                                        containerRef: this.divRef.value
                                    }))
                                }
                            })
                        ),
                        row(
                            button({
                                ...buttonAppearance,
                                text: 'Toast',
                                onClick: () => XH.toast({
                                    message: 'This is a toast. Bottom right by default.'
                                })
                            }),
                            button({
                                ...buttonAppearance,
                                text: 'Toast w/ timeout',
                                onClick: () => XH.toast({
                                    message: span('This is a toast has a ', code('timeout: 5000')),
                                    timeout: 5000
                                })
                            }),
                            button({
                                ...buttonAppearance,
                                text: 'Toast, anchored',
                                onClick: () => {
                                    console.log(this.divRef.value);
                                    XH.toast({
                                        message: span('This is a Toast anchored to a ', code('containerRef')),
                                        containerRef: this.divRef.value
                                    });
                                }
                            })
                        )
                    )

                })
            })

        });
    }
}