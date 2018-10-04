/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import {table, tbody, tr, td, th} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {code} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';


import './MiscPanel.scss';

@HoistComponent
export class MiscPanel extends Component {

    FEEDBACK = 'XH.showFeedbackDialog()';
    ABOUT = 'XH.showAboutDialog()';
    TOGGLE = 'XH.toggleTheme()';
    render() {
        return wrapper({
            item: panel({
                title: 'Other XH actions',
                height: 300,
                width: 500,
                className: 'toolbox-misc-panel',
                item: table({
                    className: 'xh-table',
                    items: [
                        tbody(
                            tr(
                                th('Description'), th('Code'), th(''), th('')
                            ),
                            tr(
                                td('User feedback'),
                                td(code(this.FEEDBACK)),
                                td(
                                    button({
                                        style: {
                                            width: 40
                                        },
                                        icon: Icon.play(),
                                        onClick: () => XH.showFeedbackDialog()
                                    })
                                ),
                                td(
                                    button({
                                        style: {
                                            width: 40
                                        },
                                        icon: Icon.copy(),
                                        onClick: () => {
                                            navigator.clipboard.writeText(this.FEEDBACK);
                                            XH.toast({
                                                message: 'Copied code to clipboard',
                                                intent: 'success'});
                                        }
                                    })
                                )
                            ),
                            tr(
                                td('App Specs'),
                                td(code(this.ABOUT)),
                                td(
                                    button({
                                        style: {
                                            width: 40
                                        },
                                        icon: Icon.play(),
                                        onClick: () => eval(this.ABOUT)
                                    })
                                ),
                                td(
                                    button({
                                        style: {
                                            width: 40
                                        },
                                        icon: Icon.copy(),
                                        onClick: () => {
                                            navigator.clipboard.writeText(this.ABOUT);
                                            XH.toast({
                                                message: 'Copied code to clipboard',
                                                intent: 'success'});
                                        }
                                    })
                                )
                            ),
                            tr(
                                td('Light/Dark Theme'),
                                td(code(this.TOGGLE)),
                                td(
                                    button({
                                        style: {
                                            width: 40
                                        },
                                        icon: Icon.play(),
                                        onClick: () => eval(this.TOGGLE)
                                    })
                                ),
                                td(
                                    button({
                                        style: {
                                            width: 40
                                        },
                                        icon: Icon.copy(),
                                        onClick: () => {
                                            navigator.clipboard.writeText(this.TOGGLE);
                                            XH.toast({
                                                message: 'Copied code to clipboard',
                                                intent: 'success'});
                                        }
                                    })
                                )
                            )
                        )
                    ]
                })
            })
        });
    }

}