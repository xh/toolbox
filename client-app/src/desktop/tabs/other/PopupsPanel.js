/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common';
import {p, div} from '@xh/hoist/cmp/layout';
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

        return wrapper({
            description: p('here are some popups'),
            items: [
                div(
                    button({
                        ...buttonAppearance,
                        text: 'Alert',
                        onClick: () => XH.alert({
                            title: 'Aawwwwww',
                            message: 'this is an alert dialog.'
                        })
                    }),
                    button({
                        ...buttonAppearance,
                        text: 'Confirm',
                        onClick: () => XH.confirm({
                            title: 'Confirm',
                            message: 'This is a confirm dialoge.'
                        })
                    }),
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
                    button({
                        ...buttonAppearance,
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