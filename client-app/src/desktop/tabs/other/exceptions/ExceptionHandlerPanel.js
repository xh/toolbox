import {creates, hoistCmp} from '@xh/hoist/core';
import {wrapper} from '../../../common';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {vframe, hframe, div, hbox, label, filler} from '@xh/hoist/cmp/layout';
import {buttonGroupInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {ExceptionHandlerModel} from './ExceptionHandlerModel';
import {capitalize} from 'lodash';

export const exceptionHandlerPanel = hoistCmp.factory({
    model: creates(ExceptionHandlerModel),
    render() {
        return wrapper({
            description: (
                <div>
                    <p>
                        Hoist provides centralized exception handling for Hoist Applications, including providing a
                        managed display of the exception to the user, and providing options for introspection, tracking
                        and notification of the problem to back-end administrators.
                    </p>
                    <p>
                        Some errors may require an app refresh, while others do not. Errors may also be marked as
                        "routine" and need not reveal further details to the user beyond the stringified error message.
                        Users also have the option to send a message to the configured support email address to report
                        additional information about the error.
                    </p>
                    <p>
                        <code>XH.handleException()</code> provides a convenient API for apps to handle exceptions and
                        is typically called directly in catch blocks.  <code>Promise.catchDefault()</code> provides a
                        convenient API to the same functionality in Promise chains.
                    </p>
                </div>
            ),
            links: [
                {url: '$TB/client-app/src/desktop/tabs/other/exceptions/ExceptionHandler.js', notes: 'This example'},
                {url: '$HR/core/XH.js', notes: 'XH top-level Singleton model - see .handleException()'},
                {url: '$HR/core/ExceptionHandler.js', notes: 'ExceptionHandler Base Class'},
                {url: '$HR/promise/Promise.js', notes: 'Hoist promise enhancement methods - see .catchDefault()'}
            ],
            item: panel({
                title: 'Other > Exception Handler',
                icon: Icon.skull(),
                width: 700,
                item: hframe(
                    buttonContainer(),
                    displayOptions()
                )
            })
        });
    }
});

const buttonContainer = hoistCmp.factory(
    () => panel({
        flex: 1,
        item: vframe({
            margin: 10,
            items: [
                vframe({
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 15,
                    items: [
                        exceptionButton({type: 'standard'}),
                        exceptionButton({type: 'routine'})
                    ]
                }),
                div({
                    item: 'Open your developer console to see how Hoist is logging and tracking exceptions when clicking ' +
                        'the buttons above.'
                })
            ]
        })
    })
);

const exceptionButton = hoistCmp.factory({
    render({model, type}) {
        const isRoutine = type === 'routine',
            iconName = isRoutine ? 'info' : 'warning';
        return button({
            text: `Simulate a ${capitalize(type)} Exception`,
            icon: Icon[iconName]({size: 'lg'}),
            height: 100,
            width: 250,
            margin: 10,
            intent: isRoutine ? 'primary' : 'danger',
            minimal: false,
            onClick: () => model.throwException(type)
        });
    }
});

const displayOptions = hoistCmp.factory(
    ({model})=> panel({
        title: 'Options',
        icon: Icon.settings(),
        className: 'tbox-display-opts',
        compactHeader: true,
        model: {side: 'right', defaultSize: 250, resizable: false},
        item: div({
            className: 'tbox-display-opts__inner',
            items: [
                'Title',
                textInput({
                    bind: 'title',
                    placeholder: 'Error',
                    width: null
                }),
                'Message',
                textInput({
                    bind: 'message',
                    placeholder: '[Exception Message]',
                    width: null
                }),
                switchInput({
                    bind: 'logOnServer',
                    label: 'Log On Server',
                    labelSide: 'left'
                }),
                switchInput({
                    bind: 'showAlert',
                    label: 'Show Alert',
                    labelSide: 'left'
                }),
                switchInput({
                    bind: 'requireReload',
                    label: 'Require Reload',
                    labelSide: 'left',
                    disabled: !model.showAlert
                }),
                hbox({
                    alignItems: 'center',
                    items: [
                        label({
                            className: `bp4-control bp4-switch bp4-inline bp4-align-right xh-input xh-switch-input${!model.showAlert ? ' bp4-disabled xh-input-disabled' : ''}`,
                            item: 'Alert Type'
                        }),
                        filler(),
                        buttonGroupInput({
                            bind: 'alertType',
                            disabled: !model.showAlert,
                            items: [
                                button({
                                    margin: 0,
                                    text: 'Dialog',
                                    value: 'dialog'
                                }),
                                button({
                                    margin: 0,
                                    text: 'Toast',
                                    value: 'toast'
                                })]
                        })
                    ]
                })
            ]
        })
    })
);