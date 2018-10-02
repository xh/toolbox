/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {vframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {formGroup} from '@xh/hoist/kit/blueprint';
import {wrapper} from '../../common';
import {button} from '@xh/hoist/desktop/cmp/button';
import {
    textInput
} from '@xh/hoist/desktop/cmp/form';
import './MiscPanel.scss';

@HoistComponent
export class MiscPanel extends Component {

    render() {
        return wrapper({
            item: panel({
                title: `Other XH actions`,
                height: 400,
                width: 700,
                className: 'toolbox-misc-panel',
                item: vframe({
                    width: '90%',
                    items: [
                        formGroup({
                            item: button({
                                    text: 'Feedback dialog',
                                    onClick: () => XH.showFeedbackDialog()
                                }),
                            helperText: 'XH.showFeedbackDialog()',
                        }),
                        formGroup({
                            item: button({
                                text: 'Show app details',
                                onClick: () => XH.showAboutDialog()
                            }),
                            helperText: 'XH.showFeedbackDialog()',
                        }),
                        formGroup({
                            item: button({
                                text: 'Show user info',
                                onClick: () => XH.showAboutDialog()
                            }),
                            helperText: 'XH.showFeedbackDialog()',
                        }),
                        formGroup({
                            item: button({
                                text: 'Toggle dark theme',
                                onClick: () => XH.toggleTheme()
                            }),
                            helperText: 'XH.showFeedbackDialog()',
                        }),
                    ]
                })
            })
        })
    }

    textField = ({field, info}) => {
        const {localModel: model} = this;
        const label = startCase(field);
        return formField({
            item: textInput(),
            label: label,
            field: field,
            labelInfo: info,
            model
        })
    }

}