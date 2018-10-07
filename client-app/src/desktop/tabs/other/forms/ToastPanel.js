/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core/index';
import {vspacer, hframe, box} from '@xh/hoist/cmp/layout/index';
import {panel} from '@xh/hoist/desktop/cmp/panel/index';
import {wrapper} from '../../../common/index';
import {Icon} from '@xh/hoist/icon/index';
import {div, span} from '@xh/hoist/cmp/layout/index';
import {button} from '@xh/hoist/desktop/cmp/button/index';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar/index';
import {ToastModel} from './ToastModel';
import {
    numberInput,
    textArea,
    select,
    jsonInput
} from '@xh/hoist/desktop/cmp/form/index';
import './ToastPanel.scss';

@HoistComponent
export class ToastPanel extends Component {

    localModel = new ToastModel();

    render() {
        const {position, fnString, INTENT_OPTIONS, SIDE, ALIGNMENT, POSITION_MODE} = this.localModel,
            {localModel: model} = this;
        return wrapper({
            item: panel({
                title: 'Toast',
                height: 500,
                width: '80%',
                className: 'toolbox-toast-panel',
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
                                        message: 'Reset Toast Params',
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
                                        readOnly: 'nocursor'
                                    }
                                })
                            })
                        ]
                    }),
                    toolbar({
                        vertical: true,
                        width: '50%',
                        items: [
                            vspacer(20),
                            span({
                                className: 'options-divider',
                                item: 'Inputs'
                            }),
                            div({
                                className: 'toolbox-toast-panel__row',
                                items: [
                                    span({
                                        className: 'indent-label',
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
                                className: 'toolbox-toast-panel__row',
                                items: [
                                    span({
                                        item: 'Timeout (ms)',
                                        className: 'indent-label'
                                    }),
                                    numberInput({
                                        field: 'timeout',
                                        commitOnChange: true,
                                        model
                                    })
                                ]
                            }),
                            div({
                                className: 'toolbox-toast-panel__row',
                                items: [
                                    span({
                                        item: 'Intent',
                                        className: 'indent-label'
                                    }),
                                    select({
                                        options: INTENT_OPTIONS,
                                        field: 'intent',
                                        model
                                    })
                                ]
                            }),
                            span({
                                className: 'options-divider',
                                item: 'Position'
                            }),
                            div({
                                className: 'toolbox-toast-panel__row',
                                items: [
                                    span({
                                        item: 'Mode',
                                        className: 'indent-label'
                                    }),
                                    select({
                                        options: POSITION_MODE,
                                        field: 'position',
                                        model
                                    })
                                ]
                            }),
                            div({
                                className: 'toolbox-toast-panel__row',
                                items: [
                                    span({
                                        item: 'Side',
                                        className: 'indent-label'
                                    }),
                                    select({
                                        options: SIDE,
                                        field: 'side',
                                        disabled: !!position,
                                        model
                                    })
                                ]
                            }),
                            div({
                                className: 'toolbox-toast-panel__row',
                                items: [
                                    span({
                                        item: 'Alignment',
                                        className: 'indent-label'
                                    }),
                                    select({
                                        options: ALIGNMENT,
                                        field: 'alignment',
                                        disabled: !!position,
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
