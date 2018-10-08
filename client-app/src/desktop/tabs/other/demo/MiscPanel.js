/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel/index';
import {wrapper} from '../../../common/index';
import {table, tbody, tr, th, thead} from '@xh/hoist/cmp/layout/index';
import {tableRow} from './TableRow'
import './DemoPanel.scss';

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
                width: 700,
                className: 'toolbox-demo-panel',
                item: table({
                    className: 'xh-table',
                    items: [
                        thead(
                            tr(
                                th(''), th('Code'), th('Description')
                            )
                        ),
                        tbody(
                            tableRow({
                                xhCode: 'XH.showFeedbackDialog()',
                                description: 'Show a dialog to elicit feedback text from users.'
                            }),
                            tableRow({
                                xhCode: 'XH.showAboutDialog()',
                                description: `Show 'about' dialog with info about the app and environment.`
                }),
                            tableRow({
                                xhCode: 'XH.toggleTheme()',
                                description: 'Toggle the theme between light and dark variants.'
                            })
                        )
                    ]
                })
            })
        });
    }
}