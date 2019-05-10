/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common';
import {p, div, table, tr, th, td, tbody} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';

import './PopupsPanel.scss';

@HoistComponent
export class PopupsPanel extends Component {

    render() {

        const buttonAppearance = {
            icon: Icon.add(),
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
            // className: 'recalls-popup-panel',
            item: div({
                className: 'toolbox-popups-panel',
                item: table(tbody(
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
                                message: 'Messages are highly configurable.',
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
                        })
                    )
                ))
            })
        });
    }
}