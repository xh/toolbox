/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common';
import {p, div, table, tr, td, tbody} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {Ref} from '@xh/hoist/utils/react';

import './PopupsPanel.scss';

@HoistComponent
export class PopupsPanel extends Component {

    divRef = new Ref();

    render() {

        const buttonAppearance = {
            icon: Icon.add(),
            minimal: false,
            flex: 1,
            margin: 5
        };
        const row = (col1, col2, col3, col4) => {
            return tr(
                td(col1), td(col2), td(col3), td(col4)
            );
        };

        return wrapper({
            description: p('here are some popups'),
            item: table({
                className: 'toolbox-popups-table',
                ref: this.divRef.ref,
                item: tbody(
                    row(
                        button({
                            ...buttonAppearance,
                            text: 'Alert',
                            onClick: () => XH.alert({
                                title: 'Alert',
                                message: 'This is an alert.  Notice the "OK" button'
                            })
                        }),
                        button({
                            ...buttonAppearance,
                            text: 'Alert',
                            onClick: () => XH.alert({
                                title: 'Alert with a'
                            })
                        })
                    ),
                    row(
                        button({
                            ...buttonAppearance,
                            text: 'Confirm',
                            onClick: () => XH.confirm({
                                title: 'Confirm',
                                message: 'This is a confirm dialoge. Notice the two button choices.'
                            })
                        }),
                    ),
                    row(
                        button({
                            ...buttonAppearance,
                            text: 'Message',
                            onClick: () => XH.message({
                                title: 'Message',
                                message: 'Messages are highly configurable.  Just check out the ' +
                                    'text in these awesome buttons!',
                                confirmText: 'Oh I see...',
                                cancelText: 'Nope, no seas here.'
                            })
                        }),
                    ),
                    row(
                        button({
                            ...buttonAppearance,
                            text: 'Toast',
                            onClick: () => XH.toast({
                                message: 'This is a toast.'
                            })
                        }),
                        button({
                            ...buttonAppearance,
                            text: 'Toast w/ timeout',
                            onClick: () => XH.toast({
                                message: 'This is a toast with `timeout: 5000`',
                                timeout: 5 * SECONDS
                            })
                        }),
                        button({
                            ...buttonAppearance,
                            text: 'Toast w/ intent',
                            onClick: () => XH.toast({
                                message: "This is a toast with `intent: 'danger'`",
                                intent: 'danger'
                            })
                        }),
                        button({
                            ...buttonAppearance,
                            text: 'Toast, anchored',
                            onClick: () => {
                                console.log(this.divRef.value);
                                XH.toast({
                                    message: 'This is a Toast anchored to the panel',
                                    containerRef: this.divRef.value
                                });
                            }
                        })
                    )
                )

            })

        });
    }
}