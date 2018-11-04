/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import {code, hframe, thead, tbody, table, tr, td, th} from '@xh/hoist/cmp/layout';
import {
    radioInput,
    switchInput,
    textInput,
    dateInput
} from '@xh/hoist/desktop/cmp/form';
import {fmtDate} from '@xh/hoist/format';

import {card, formGroup} from '@xh/hoist/kit/blueprint';
import {DateFormatsPanelModel} from './DateFormatsPanelModel';
import './FormatsTab.scss';


@HoistComponent
export class DateFormatsPanel extends Component {

    localModel = new DateFormatsPanelModel();

    render() {
        return wrapper({
            description: [
                <p>
                    Hoist provides a collection of date formatting functions in <a href="https://github.com/exhi/hoist-react/blob/master/format/FormatDate.js" target="_blank">FormatDate.js</a>.
                    The main method is <code>fmtDate</code> which provides several useful options.  More specific methods delegate to <code>fmtDate</code> and set useful defaults..
                    FormatDate is backed by <a href="https://momentjs.com/" target="_blank">moment.js</a>, and makes the full moment API available via the <code>fmt</code> property, which takes
                    a moment js string.
                </p>
            ],
            item: panel({
                title: 'Date Format',
                className: 'toolbox-formats-tab',
                width: '90%',
                height: '90%',
                item: hframe(this.renderOptions(), this.renderResults())
            })
        });
    }


    renderOptions() {
        const {model} = this;

        return panel({
            title: 'Format',
            className: 'toolbox-formats-tab__panel',
            flex: 1,
            items: [
                this.createFormGroup({
                    label: 'Function',
                    field: 'fnName',
                    item: radioInput({
                        alignIndicator: 'left',
                        inline: true,
                        options: [
                            {value: 'fmtDate', label: code('fmtDate')},
                            {value: 'fmtCompactDate', label: code('fmtCompactDate')},
                            {value: 'fmtDateTime', label: code('fmtDateTime')},
                            {value: 'fmtTime', label: code('fmtTime')}
                        ]
                    })
                }),
                card({
                    className: 'toolbox-formats-tab__panel__card',
                    omit: model.hideOptions,
                    items: [
                        this.createFormGroup({
                            field: 'fmt',
                            item: textInput({
                                commitOnChange: true,
                                placeholder: 'YYYY-MM-DD'
                            }),
                            info: 'fmt - a moment.js format string.'
                        }),
                        this.createFormGroup({
                            field: 'showTooltip',
                            item: switchInput(),
                            info: 'tooltip - function to generate a tooltip string, passed the original date value.'
                        })
                    ]
                })
            ]
        });
    }

    renderResults() {
        const {model} = this;

        return panel({
            className: 'toolbox-formats-tab__panel',
            title: 'Result',
            flex: 1,
            item: table(
                thead(
                    tr(
                        th({align: 'left', item: 'Input'}),
                        th({align: 'right', item: 'Output'})
                    )
                ),
                tbody(
                    ...model.testResults.map(([input, output], index) => {
                        const formattedInput = fmtDate(input, 'YYYY-MM-DD HH:mm');
                        return tr({
                            key: `num-${index}`,
                            items: [
                                td({align: 'left', className: 'inputColumn', item: formattedInput}),
                                td({align: 'right', className: 'outputColumn', item: output})
                            ]
                        });
                    }),
                    tr({
                        key: 'num-from-user',
                        items: [
                            td({
                                align: 'right',
                                item: formGroup({
                                    label: 'Try it:',
                                    inline: true,
                                    width: '90%',
                                    item: dateInput({model, field: 'tryItDate', timePrecision: 'minute'})
                                })
                            }),
                            td({
                                align: 'right',
                                item: model.tryItResult
                            })
                        ]
                    })
                )
            )
        });
    }

    createFormGroup({label, field, item, info}) {
        const {model} = this;

        const formProps = {
            label,
            item: React.cloneElement(item, {model, field}),
            helperText: info
        };
        formProps.labelInfo = model[field];

        return formGroup(formProps);
    }
}
