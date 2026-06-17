import {creates, hoistCmp} from '@xh/hoist/core';
import {wrapper, wrapperOption} from '../../../common';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {vframe, div} from '@xh/hoist/cmp/layout';
import {segmentedControl, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {ExceptionHandlerModel} from './ExceptionHandlerModel';
import {capitalize} from 'lodash';

export const exceptionHandlerPanel = hoistCmp.factory({
    model: creates(ExceptionHandlerModel),
    render({model}) {
        return wrapper({
            title: 'Exception Handler',
            icon: Icon.skull(),
            description: [
                'Hoist provides centralized exception handling for applications, including a',
                'managed display of the error to the user and options for introspection,',
                'tracking, and notifying back-end administrators of the problem.',
                '',
                'Some errors may require an app refresh, while others do not. Errors may also',
                'be marked as "routine" and need not reveal further details to the user beyond',
                'the stringified error message. Users also have the option to send a message',
                'to the configured support email address to report additional information',
                'about the error.',
                '',
                '`XH.handleException()` provides a convenient API for apps to handle',
                'exceptions and is typically called directly in catch blocks.',
                '`Promise.catchDefault()` provides a convenient API to the same functionality',
                'in Promise chains.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/exceptions/ExceptionHandlerPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/docs/error-handling.md',
                    text: 'Error handling docs',
                    notes: 'Centralized exception handling and display guide.'
                },
                {
                    url: '$HR/core/XH.ts',
                    notes: 'Top-level singleton; see .handleException().'
                },
                {
                    url: '$HR/core/ExceptionHandler.ts',
                    notes: 'Implementation behind XH.handleException().'
                },
                {
                    url: '$HR/promise/Promise.ts',
                    notes: 'Hoist Promise enhancements; see .catchDefault().'
                }
            ],
            options: [
                wrapperOption({
                    label: 'Title',
                    propName: 'ExceptionHandlerOptions.title',
                    control: textInput({model, bind: 'title', placeholder: 'Error', width: 150})
                }),
                wrapperOption({
                    label: 'Message',
                    propName: 'ExceptionHandlerOptions.message',
                    control: textInput({
                        model,
                        bind: 'message',
                        placeholder: '[Exception Message]',
                        width: 150
                    })
                }),
                wrapperOption({
                    label: 'Log On Server',
                    propName: 'ExceptionHandlerOptions.logOnServer',
                    control: switchInput({model, bind: 'logOnServer'}),
                    info: "Log to the server's Admin Console."
                }),
                wrapperOption({
                    label: 'Show Alert',
                    propName: 'ExceptionHandlerOptions.showAlert',
                    control: switchInput({model, bind: 'showAlert'}),
                    info: 'Off handles the exception silently.'
                }),
                wrapperOption({
                    label: 'Require Reload',
                    propName: 'ExceptionHandlerOptions.requireReload',
                    control: switchInput({
                        model,
                        bind: 'requireReload',
                        disabled: !model.showAlert
                    }),
                    info: 'Force a full app reload to dismiss.'
                }),
                wrapperOption({
                    label: 'Alert Type',
                    propName: 'ExceptionHandlerOptions.alertType',
                    control: segmentedControl({
                        model,
                        bind: 'alertType',
                        disabled: !model.showAlert,
                        options: [
                            {value: 'dialog', label: 'Dialog'},
                            {value: 'toast', label: 'Toast'}
                        ]
                    })
                })
            ],
            item: buttonContainer()
        });
    }
});

const buttonContainer = hoistCmp.factory(() =>
    panel({
        // Sized to match the sibling Error Message demo card.
        width: 700,
        height: 350,
        item: vframe({
            margin: 10,
            items: [
                vframe({
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 15,
                    items: [exceptionButton({type: 'standard'}), exceptionButton({type: 'routine'})]
                }),
                div(
                    'Open your developer console to see how Hoist is logging and tracking exceptions when clicking ' +
                        'the buttons above.'
                )
            ]
        })
    })
);

const exceptionButton = hoistCmp.factory<ExceptionHandlerModel>({
    render({model, type}) {
        const isRoutine = type === 'routine',
            iconName = isRoutine ? 'info' : 'warning';
        return button({
            text: `Simulate a ${capitalize(type)} Exception`,
            icon: Icon[iconName]({size: 'lg'}),
            height: 70,
            width: 250,
            margin: 10,
            intent: isRoutine ? 'primary' : 'danger',
            minimal: false,
            onClick: () => model.throwException(type)
        });
    }
});
