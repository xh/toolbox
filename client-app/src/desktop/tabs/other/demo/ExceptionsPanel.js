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
import {div, table, tbody, tr, th, thead} from '@xh/hoist/cmp/layout/index';
import {tableRow} from './TableRow';


@HoistComponent
export class ExceptionsPanel extends Component {
    render() {
        return wrapper({
            item: panel({
                title: 'Exceptions',
                height: '75%',
                width: '90%',
                className: 'toolbox-demo-panel',
                item:
                    div({
                        className: 'demo-table-scroller',
                        item: table({
                            className: 'xh-table',
                            items: [
                                thead(tr(th(''), th('Code'), th('Description'))),
                                tbody(
                                    tableRow({
                                        xhCode: `{message: 'That's a mistake!', title: 'XH Error Title'}`,
                                        description: `XH.message(): Modal dialog with no default button text`,
                                        onClick: () => this.onClick({message: 'Stop doing that!', title: 'XH Error Title'})
                                    }),
                                    tableRow({
                                        xhCode: `{logOnServer: false}`,
                                        description: ``,
                                        onClick: () => this.onClick({logOnServer: false})
                                    }),
                                    tableRow({
                                        xhCode: `{showAlert: false}`,
                                        description: ``,
                                        onClick: () => this.onClick({showAlert: false})
                                    }),
                                    tableRow({
                                        xhCode: `{showAsError: false}`,
                                        description: ``,
                                        onClick: () => this.onClick({showAsError: false})
                                    }),
                                    tableRow({
                                        xhCode: `{requireReload: true}`,
                                        description: ``,
                                        onClick: () => this.onClick({requireReload: true})
                                    }),
                                    tableRow({
                                        xhCode: `{hideParams: ['password']}`,
                                        description: ``,
                                        onClick: () => this.onClick({hideParams: ['password']})
                                    }),
                                    tableRow({
                                        xhCode: `{alertKey: 'test'}`,
                                        description: ``,
                                        onClick: () => this.repeatException({alertKey: 'test'})
                                    })
                                )
                            ]
                        })
                    })

            })
        })
    }

    onClick = async (opts) => {
        return XH.fetchJson({
            url: 'badPath',
            params: {password: 'Password'}
        }).catchDefault(opts);
    }

    repeatException = (opts) => {
        XH.handleException('Test', opts);
        setTimeout(() => XH.handleException('Other', opts), 3000);
    }

}