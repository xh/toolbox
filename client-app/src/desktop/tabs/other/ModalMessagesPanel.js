/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {vspacer, hframe, box} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import {Icon} from '@xh/hoist/icon';
import {div, span} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar/index';
import {ModalMessagesModel} from './ModalMessagesModel';
import {
    textInput,
    radioInput,
    textArea,
    select,
    jsonInput
} from '@xh/hoist/desktop/cmp/form';
import './ModalMessagesPanel.scss';

@HoistComponent
export class ModalMessagesPanel extends Component {

    localModel = new ModalMessagesModel();

    render() {
        const {fnString, INTENT_OPTIONS, confirmText, cancelText} = this.localModel,
            {localModel: model} = this;
        return wrapper({
            item: panel({
                title: 'Modal Messages',
                height: 500,
                width: '80%',
                className: 'toolbox-modal-panel',
                item: hframe(
                    panel({
                        tbar: toolbar(
                            button({
                                text: 'Run',
                                icon: Icon.play(),
                                onClick: () => eval(fnString)
                            }),
                            button({
                                text: 'Copy',
                                icon: Icon.copy(),
                                onClick: () => {
                                    navigator.clipboard.writeText(fnString);
                                    XH.toast({
                                        message: 'Copied code to clipboard',
                                        intent: 'success'});
                                }
                            }),
                            button({
                                text: 'Reset',
                                icon: Icon.refresh(),
                                onClick: () => {
                                    model.onResetClick();
                                    XH.toast({
                                        message: 'Reset Modal Params',
                                        intent: 'success'
                                    });
                                }
                            })
                        ),
                        items: [
                            box({
                                item: jsonInput({
                                    value: fnString,
                                    editorProps: {
                                        lineWrapping: true,
                                        mode: 'text/javascript',
                                        readOnly: true
                                    }
                                })
                            })
                        ]
                    }),
                    toolbar({
                        vertical: true,
                        width: 400,
                        items: [
                            vspacer(5),
                            div({
                                item: radioInput({
                                    field: 'modalType',
                                    alignIndicator: 'right',
                                    inline: true,
                                    options: [
                                        {value: 'message', label: 'Message'},
                                        {value: 'alert', label: 'Alert'},
                                        {value: 'confirm', label: 'Confirm'}
                                    ],
                                    model
                                })
                            }),
                            vspacer(20),
                            div({
                                className: 'toolbox-modal-panel__row',
                                items: [
                                    span({
                                        item: 'Message'
                                    }),
                                    textArea({
                                        field: 'message',
                                        style: {
                                            whiteSpace: 'normal'
                                        },
                                        commitOnChange: true,
                                        model
                                    })
                                ]
                            }),
                            div({
                                className: 'toolbox-modal-panel__row',
                                items: [
                                    span({
                                        item: 'Title'
                                    }),
                                    textInput({
                                        field: 'title',
                                        width: '100%',
                                        commitOnChange: true,
                                        model
                                    })
                                ]
                            }),
                            span({
                                className: 'options-divider',
                                item: 'Confirm Button'
                            }),
                            div({
                                className: 'toolbox-modal-panel__row',
                                items: [
                                    span({
                                        className: 'indent-label',
                                        item: 'Text'
                                    }),
                                    textInput({
                                        field: 'confirmText',
                                        width: '100%',
                                        commitOnChange: true,
                                        model
                                    })
                                ]
                            }),
                            div({
                                className: 'toolbox-modal-panel__row',
                                items: [
                                    span({
                                        item: 'Intent',
                                        className: 'indent-label'
                                    }),
                                    select({
                                        options: INTENT_OPTIONS,
                                        field: 'confirmIntent',
                                        disabled: !confirmText,
                                        model
                                    })
                                ]
                            }),
                            span({
                                className: 'options-divider',
                                item: 'Cancel Button'
                            }),
                            div({
                                className: 'toolbox-modal-panel__row',
                                items: [
                                    span({
                                        className: 'indent-label',
                                        item: 'Text'
                                    }),
                                    textInput({
                                        field: 'cancelText',
                                        width: '100%',
                                        commitOnChange: true,
                                        model
                                    })
                                ]
                            }),
                            div({
                                className: 'toolbox-modal-panel__row',
                                items: [
                                    span({
                                        item: 'Intent',
                                        className: 'indent-label'
                                    }),
                                    select({
                                        options: INTENT_OPTIONS,
                                        field: 'cancelIntent',
                                        disabled: !cancelText,
                                        model
                                    })
                                ]
                            })
                        ]
                    })
                )
            })
        });
    }

}
