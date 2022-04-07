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
                        The <code>ExceptionHandler</code> class provides centralized exception handling for Hoist
                        Applications, including managing the logging and displaying of exceptions.
                    </p>
                    <p>
                        The <code>ExceptionHandler</code> is not typically used directly by an application. Instead,
                        <code>XH.handleException()</code> provides a convenient API for apps to handle exceptions.
                        It is typically called directly in <code>catch()</code> blocks.
                    </p>
                    <p>
                        See also <code>Promise.catchDefault()</code>. That method will delegate its arguments to
                        <code>XH.handleException()</code> and provides a more convenient interface for catching
                        exceptions in Promise chains.
                    </p>
                </div>),
            links: [
                {url: '$TB/client-app/src/desktop/tabs/other/exceptions/ExceptionHandler.js', notes: 'This example'},
                {url: '$HR/core/XH.js', notes: 'XH top-level Singleton model - see .handleException()'},
                {url: '$HR/core/ExceptionHandler.js', notes: 'ExceptionHandler Base Class'},
                {url: '$HR/promise/Promise.js', notes: 'Hoist promise enhancement methods - see .catchDefault()'}
            ],
            item: panel({
                title: 'Other > ExceptionHandler',
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
                        exceptionButton({type: 'fatal'}),
                        exceptionButton({type: 'routine'})
                    ]
                }),
                div(<p>Open your developer console to see how Hoist elegantly handles exceptions.  Hoist's Exception
                    Handler can also display alerts to the user and/or log exceptions on the server.</p>)
            ]
        })
    })
);

const exceptionButton = hoistCmp.factory({
    render({model, type}) {
        const isFatal = type === 'fatal',
            iconName = isFatal ? 'skull' : 'warning';
        return button({
            text: `Simulate a ${capitalize(type)} Exception`,
            icon: Icon[iconName]({size: 'lg'}),
            height: 100,
            width: 250,
            margin: 10,
            intent: type === 'fatal' ? 'danger' : 'warning',
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
                textInput({
                    bind: 'title',
                    label: 'Title',
                    placeholder: 'Title for an alert dialog, if shown',
                    width: null
                }),
                textInput({
                    bind: 'message',
                    label: 'Message',
                    placeholder: 'Shown instead of exception message',
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
                    bind: 'showAsError',
                    label: 'Show As Error',
                    labelSide: 'left',
                    disabled: !model.showAlert
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
                            className: `bp3-control bp3-switch bp3-inline bp3-align-right xh-input xh-switch-input${!model.showAlert ? ' bp3-disabled xh-input-disabled' : ''}`,
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