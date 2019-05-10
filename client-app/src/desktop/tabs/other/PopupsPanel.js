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

// import './PopupsPanel.scss';

@HoistComponent
export class PopupsPanel extends Component {

    render() {

        const buttonAppearance = {
            icon: Icon.add(),
            minimal: false
        };
        const row = (col1, col2, col3) => {
            return tr(
                th(col1), td(col2), td(col3)
            );
        };

        return wrapper({
            description: p('here are some popups'),
            // className: 'recalls-popup-panel',
            item: div({
                className: 'recalls-popup-panel',
                item: table(tbody(
                    row(
                        'Alert',
                        button({
                            ...buttonAppearance,
                            text: 'Alert',
                            onClick: () => XH.alert({
                                title: 'Alert',
                                message: 'This is an alert'
                            })
                        })
                    ),
                    row(
                        'Confirm',
                        button({
                            ...buttonAppearance,
                            text: 'Confirm',
                            onClick: () => XH.confirm({
                                title: 'Confirm',
                                message: 'This is a confirm dialoge.'
                            })
                        }),
                    ),
                    row(
                        'Message',
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
                    row(
                        'Toast',
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