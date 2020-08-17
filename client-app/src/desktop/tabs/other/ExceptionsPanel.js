import {wrapper} from '../../common';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {box, code, hframe, p, vbox} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './ExceptionsPanel.scss';
import {codeInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {bindable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';

export const exceptionsPanel = hoistCmp.factory({
    model: creates(() => new Model()),
    render: ({model}) => wrapper({
        description: [
            p({
                items: [
                    'Hoist\'s ',
                    code('ExceptionHandler'),
                    ' standardizes and facilitates catching exceptions and errors on server and client sides. When an exception is caught, the ',
                    code('ExceptionDialog'),
                    ' component is able to present the error in a stringified, human-readable format and offer more details, like the HTTP status code, ',
                    'error message, and stack trace.'
                ]
            }),
            p('Some errors may require an app refresh, while others do not. Errors may also be marked as routine and ' +
                'need not reveal further details to the user beyond the stringified error message. Exception handling can ' +
                'also be customized with config options as displayed in the examples below.'),
            p('Users also have the option to send a message to their configured support email address (e.g. support@xh.io for Toolbox) ' +
                'to report additional information about the error.')
        ],
        links: [
            {url: '$HR/core/ExceptionHandler.js', notes: 'Exception Handler'},
            {url: '$HR/exception/Exception.js', notes: 'Standardized Hoist Exception/Error Class'},
            {url: '$HR/promise/Promise.js', notes: 'See Error Handling methods like catchDefault() or catchDefaultWhen()'}
        ],
        items: [
            box({
                className: 'tb-exceptions',
                items: [
                    exceptionHandlingPanel(),
                    promiseErrorPanel()
                ]
            })
        ]
    })
});

const exceptionHandlingPanel = hoistCmp.factory(
    ({model}) => {
        return panel({
            title: 'Exception Handling',
            icon: Icon.warning(),
            items: [
                p(
                    'In the ', code('fooBar'), ' function below, the Exception Handler catches the error and returns ' +
                    'an error message in the Exception Dialog.'
                ),
                p('Toggle the options below to customize exception handling on this Reference Error below.'),
                codeInput({
                    width: 'fill',
                    height: 110,
                    showFullscreenButton: false,
                    editorProps: {
                        readOnly: true,
                        indentUnit: 4
                    },
                    mode: 'javascript',
                    value: model.fooBarString
                }),
                exceptionOptions(),
                button({
                    text: 'Run fooBar()',
                    width: 250,
                    intent: 'danger',
                    outlined: true,
                    onClick: () => model.onFooBarClicked()
                })
            ]
        });
    }
);

const exceptionOptions = hoistCmp.factory(
    ({model}) => {
        const {disabled} = model;
        return panel({
            title: 'Exception Dialog Options',
            className: 'tb-exceptions__display-opts',
            icon: Icon.settings(),
            compactHeader: true,
            item: hframe(
                switchInput({
                    bind: 'showAlert',
                    label: 'Show Dialog',
                    onChange: () => model.disableWhenShowAlertFalse()
                }),
                switchInput({
                    bind: 'showAsError',
                    label: 'Show as Error',
                    disabled
                }),
                switchInput({
                    bind: 'logOnServer',
                    label: 'Log on Server'
                }),
                switchInput({
                    bind: 'requireReload',
                    label: 'Require Reload',
                    disabled
                })
            )
        });
    }
);

const promiseErrorPanel = hoistCmp.factory(
    ({model}) => {
        return panel({
            title: 'Promise Exception Handling',
            icon: Icon.warning(),
            items: [
                p(
                    'Hoist provides useful convenience methods such as ',
                    code('.catchDefault()'), ' that will handle errors when promises are rejected. ' +
                    '(No need to wrap in try/catch logic!)'
                ),
                p('Compare the two functionally equivalent code snippets below.'),
                codeInput({
                    bind: 'catchMethod',
                    height: 150,
                    width: 'fill',
                    showFullscreenButton: false,
                    editorProps: {
                        readOnly: true
                    },
                    mode: 'javascript'
                }),
                vbox(
                    button({
                        text: 'Fetch request with catchDefault()',
                        intent: 'danger',
                        outlined: true,
                        width: 250,
                        onClick: () => model.onCatchDefaultClicked()
                    }),
                    button({
                        text: 'Fetch request with XH.handleException()',
                        intent: 'danger',
                        outlined: true,
                        width: 250,
                        onClick: () => model.onHandleExceptionClicked()
                    })
                )
            ]
        });
    }
);

@HoistModel
class Model {
    @bindable showAlert = true;
    @bindable showAsError = false;
    @bindable logOnServer = false;
    @bindable requireReload = false;
    @bindable disabled = false;
    @bindable catchMethod = this.catchDefault;

    disableWhenShowAlertFalse() {
        if (!this.showAlert) {
            this.setShowAsError(false);
            this.setRequireReload(false);
            this.setDisabled(true);
        } else {
            this.setDisabled(false);
        }
    }

    onFooBarClicked() {
        const {showAlert, showAsError, logOnServer, requireReload} = this;
        try {
            this.setShowAlert(showAlert);
            this.setShowAsError(showAsError);
            this.setLogOnServer(logOnServer);
            this.setRequireReload(requireReload);
            this.fooBar();
        } catch (err) {
            XH.handleException(err, {showAlert, showAsError, logOnServer, requireReload});
            if (!showAlert && logOnServer) {
                XH.toast({message: 'In this example, the exception has been handled and logged on the server, but the Exception Dialog is ' +
                        'not shown. Use Chrome Dev Tools\' console to view the exception message.', position: 'top-center'});
            } else if (!showAlert) {
                XH.toast({message: 'In this example, the exception has been handled, but the Exception Dialog is not shown. ' +
                        'Use Chrome Dev Tools\' console to view the exception message.', position: 'top-center'});
            }
        }
    }

    onCatchDefaultClicked() {
        this.setCatchMethod(this.catchDefault);
        wait(1000).then(() => XH.fetch({url: 'badRequest'}).catchDefault());
    }

    async onHandleExceptionClicked() {
        this.setCatchMethod(this.handleException);
        try {
            await wait(1000).then(() => XH.fetch({url: 'badRequest'}));
        } catch (e) {
            XH.handleException(e);
        }
    }

    catchDefault = `async function badRequest() {
    await XH.fetch({url: 'badRequest'})
    .catchDefault();
}`;

    handleException = `async function badRequest() {
    try {
        await XH.fetch({url: 'badRequest'});
    } catch (err) {
        XH.handleException(err);
    }
}`;

    fooBarString = `function fooBar() {
    const foo = 'foo';
    return foo + bar;
}`

    /* eslint-disable */
    fooBar() {
        const foo = 'foo';
        return foo + bar;
    }
    /* eslint-enable */
}