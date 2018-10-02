/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {vframe, hbox, vspacer, hframe, box} from '@xh/hoist/cmp/layout';
import {panel, PanelSizingModel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import {startCase} from 'lodash'
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/desktop/cmp/button';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar/index';
import {ToastModel} from './ToastModel';
import {
    formField,
    numberInput,
    textInput,
    textArea,
    select,
    jsonInput
} from '@xh/hoist/desktop/cmp/form';
import './ModalMessagesPanel.scss';

@HoistComponent
export class ToastPanel extends Component {

    localModel = new ToastModel();

    rightSizingModel = new PanelSizingModel({
        defaultSize: 125,
        side: 'right'
    });

    render() {
        const {position, fnString, INTENT_OPTIONS, SIDE, ALIGNMENT, POSITION_MODE} = this.localModel,
            {localModel: model} = this;
        return wrapper({
            item: panel({
                title: `XH.toast`,
                height: 700,
                width: '80%',
                className: 'toolbox-modals-panel',
                headerItems: [
                    button({
                        icon: Icon.refresh(),
                        minimal: true,
                        large: true,
                        onClick: () => model.onResetClick()
                    })
                ],
                item: hframe(
                    vframe({
                        items: [
                            button({
                                text: 'Display modal',
                                onClick: () => eval(fnString)
                            }),
                            button({
                                text: 'Copy code to clipboard',
                                onClick: () => {
                                    navigator.clipboard.writeText(fnString);
                                    XH.toast({message: 'Copied code to clipboard'});
                                }
                            }),
                            box({
                                item: jsonInput({
                                    value: fnString,
                                    ref: React.createRef(model.taCmp)
                                })
                            })
                        ]
                    }),
                    toolbar({
                        vertical: true,
                        width: 300,
                        items: [
                            textArea({
                                field: 'message',
                                commitOnChange: true,
                                model
                            }),
                            numberInput({
                                field: 'timeout',
                                commitOnChange: true,
                                model
                            }),
                            select({
                                options: INTENT_OPTIONS,
                                field: 'intent',
                                model
                            }),
                            select({
                                options: POSITION_MODE,
                                field: 'position',
                                model
                            }),
                            select({
                                options: SIDE,
                                field: 'side',
                                disabled: !!position,
                                model
                            }),
                            select({
                                options: ALIGNMENT,
                                field: 'alignment',
                                disabled: !!position,
                                model
                            })
                        ]
                    })
                )
            })
        })
    }

    renderCode(value) {
        return jsonInput({
            editorProps: {mode: 'text/javascript', readOnly: true},
            value: value
        })
    }
}
