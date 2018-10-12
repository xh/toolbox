/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {panel} from '@xh/hoist/desktop/cmp/panel/index';
import {wrapper} from '../../../common/index';
import {div, table, tbody, tr, th, thead, td, pre} from '@xh/hoist/cmp/layout/index';
import {Icon} from '@xh/hoist/icon/index';
import {button} from '@xh/hoist/desktop/cmp/button/index';


export function demoPanel(options) {
    const {description, title, height, width, rows} = options;
    function tableRow({xhCode, description, onClick}) {
        if (!onClick && xhCode) onClick = () => eval(xhCode);
        return (
            tr({
                className: 'demo-row',
                items: [
                    td({
                        item: button({
                            icon: Icon.play(),
                            onClick: onClick
                        })
                    }),
                    td({
                        item: pre(xhCode),
                        className: 'text-cell'
                    }),
                    td({
                        item: description,
                        className: 'text-cell'
                    })
                ]
            })
        );
    }

    return wrapper({
            description,
            item: panel({
                title,
                height,
                width,
                className: 'toolbox-demo-panel',
                item:
                    div({
                        className: 'demo-table-scroller',
                        item: table({
                            className: 'xh-table',
                            items: [
                                thead(tr(th(''), th('Code'), th('Description'))),
                                tbody(
                                    rows.map(row => row.type === 'tr' ? row : tableRow(row))
                                )
                            ]
                        })
                    })
            })
    })
}

