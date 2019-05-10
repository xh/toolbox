/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common';
import {p, div, table, tr, th, td} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';



@HoistComponent
export class PopupsPanel extends Component {

    render() {

        const buttonAppearance = {
            // icon: Icon.add(),
            minimal: false,
            flex: 1,
            margin: 5
        };
        const row = (col1, col2, col3) => {
            return tr(
                th(col1), td(col2), td(col3)
            );
        };

        return wrapper({
            description: p('here are some popups'),
            items: [
                table(
                    row(
                        'Alert',
                        button({
                            text: 'Alert',
                            onClick: () => XH.alert({
                                title: 'Alert',
                                message: 'This is an alert'
                            })
                        })
                    ),
                    row('Confirm'),
                    row('Message'),
                    row('Toast')
                ),
                div(
                    button({
                        ...buttonAppearance,
                        text: 'Confirm',
                        onClick: () => XH.confirm({
                            title: 'Confirm',
                            message: 'This is a confirm dialoge.'
                        })
                    }),
                ),
                div(
                    button({
                        ...buttonAppearance,
                        text: 'Message (alert)',
                        onClick: () => XH.alert({
                            title: 'Message',
                            message: 'Messages are highly configurable.',
                            confirmText: 'Ok, got it',
                            cancelText: 'Exit'
                        })
                    }),
                    button({...buttonAppearance,
                        text: 'Message (confirm)',
                        onClick: () => XH.confirm({
                            title: 'Message',
                            message: 'Messages are highly configurable.',
                            confirmText: 'Ok, got it',
                            cancelText: 'Exit'
                        })
                    }),
                    button({
                        ...buttonAppearance,
                        text: 'Message (message)',
                        onClick: () => XH.message({
                            title: 'Message',
                            message: 'Messages are highly configurable.',
                            confirmText: 'Ok, got it',
                            cancelText: 'Exit'
                        })
                    }),
                ),
                div(
                    button({
                        ...buttonAppearance,
                        text: 'Toast',
                        onClick: () => XH.toast({
                            message: 'This is a toast.'
                        })
                    })
                )
            ]
        });
    }
}