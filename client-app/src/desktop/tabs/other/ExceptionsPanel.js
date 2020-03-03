import {wrapper} from '../../common';
import {hoistCmp, HoistModel} from '@xh/hoist/core';
import {box, filler, hframe, p, vbox} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './ExceptionsPanel.scss';
import {XH} from '@xh/hoist/core';
import {codeInput, switchInput} from '@xh/hoist/desktop/cmp/input';
import {bindable} from '@xh/hoist/mobx';
import {creates} from '@xh/hoist/core/modelspec';

export const exceptionsPanel = hoistCmp.factory({
    model: creates(() => new Model()),
    render: ({model}) => wrapper({
        description: [
            p('Hoist\'s Exception Handler standardizes and facilitates catching exceptions and errors on server and client sides. When an exception is caught, the Exception Dialog component is able to present the error in a stringified, human-readable format and offer more details, like the HTTP status code, error message, and stack trace.'),
            p('Some errors may require an app refresh, while others do not. Errors may also be marked as routine and need not reveal further details to the user beyond the stringified error message. Exception handling can also be customized with config options as displayed in the examples below.'),
            p('Users also have the option to send a message to their configured support email address (e.g. support@xh.io for Toolbox) to report additional information about the error.')
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
                    panel({
                        title: 'Exception Handling',
                        icon: Icon.warning(),
                        items: [
                            p('In the `fooBar` function below, the Exception Handler catches the error and returns a readable error message in the Exception Dialog. Toggle the options below to customize exception handling on this Reference Error below.'),
                            codeInput({
                                width: 'fill',
                                height: 135,
                                showFullscreenButton: false,
                                editorProps: {
                                    readOnly: true,
                                    indentUnit: 4
                                },
                                mode: 'javascript',
                                value: fooBarString
                            }),
                            exceptionOptions(),
                            button({
                                text: 'Run fooBar()',
                                className: 'xh-button',
                                minimal: false,
                                icon: Icon.warningCircle({className: 'xh-red'}),
                                onClick: () => model.onFooBarClicked()
                            })]
                    }),
                    panel({
                        title: 'Promise Exception Catching',
                        icon: Icon.warning(),
                        items: [
                            p('Hoist provides neat .catchDefault() and .catchDefaultWhen() methods that will handle exceptions and smart decode HTTP responses. (No need to wrap in try/catch logic!)'),
                            codeInput({
                                height: 150,
                                width: 'fill',
                                showFullscreenButton: false,
                                editorProps: {
                                    readOnly: true
                                },
                                mode: 'javascript',
                                bind: 'catchMethod'
                            }),
                            filler(),
                            vbox({
                                items: [
                                    button({
                                        text: 'Fetch promise with catchDefault()',
                                        minimal: false,
                                        icon: Icon.warningCircle({className: 'xh-red'}),
                                        onClick: () => model.onCatchDefaultClicked()
                                    }),
                                    button({
                                        text: 'Fetch promise with catchDefaultWhen()',
                                        minimal: false,
                                        icon: Icon.warningCircle({className: 'xh-red'}),
                                        onClick: () => model.onCatchDefaultWhenClicked()
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    })
});

/* eslint-disable */
function fooBar() {
    const foo = 'foo';
    return foo + bar;
}

const fooBarString = `function fooBar() {
    const foo = 'foo';
    return foo + bar;
}`
/* eslint-enable */
@HoistModel
class Model {
    @bindable catchMethod = `/*\n  Make a bad fetch request to \n  xh.io/badRequest with these methods!\n\n  The 404 error will appear in a dialog\n  by default, or not shown when specified\n  in the catchDefaultWhen() selector.\n*/`;
    @bindable showAlert = true;
    @bindable showAsError = false;
    @bindable logOnServer = false;
    @bindable requireReload = false;
    @bindable disabled = false;

    disableOptions() {
        if (!this.showAlert) {
            this.setShowAsError(false);
            this.setRequireReload(false);
            this.setDisabled(true);
        } else {
            this.setDisabled(false);
        }
    }
    onFooBarClicked() {
        try {
            this.setLogOnServer(this.logOnServer);
            this.setShowAlert(this.showAlert);
            this.setShowAsError(this.showAsError);

            this.setRequireReload(this.requireReload);
            fooBar();
        } catch (e) {
            XH.handleException(e, {showAlert: this.showAlert, showAsError: this.showAsError, logOnServer: this.logOnServer, requireReload: this.requireReload});
        }
    }
    onCatchDefaultClicked() {
        this.setCatchMethod(this.catchDefault);
        XH.fetch({url: 'badRequest'}).catchDefault();
    }
    onCatchDefaultWhenClicked() {
        this.setCatchMethod(this.catchDefaultWhen);
        XH.fetch({url: 'badRequest'}).catchDefaultWhen(e => e.httpStatus !== 404);
    }

    catchDefault = `function badRequest() {\n    XH.fetch({url: 'badRequest'})\n    .catchDefault();\n}`;
    catchDefaultWhen = `function badRequest() {\n    XH.fetch({url: 'badRequest'})\n    .catchDefaultWhen(e => {\n        e.httpStatus !== 404\n    })\n}`;
}

const exceptionOptions = hoistCmp.factory(
    ({model}) => {
        return panel({
            title: 'Exception Dialog Options',
            className: 'tbox-display-opts',
            icon: Icon.settings(),
            compactHeader: true,
            item: hframe(
                switchInput({
                    bind: 'showAlert',
                    label: 'Show Dialog',
                    onChange: model.disableOptions()
                }),
                switchInput({
                    bind: 'showAsError',
                    disabled: model.disabled,
                    label: 'Show As Error'
                }),
                switchInput({
                    bind: 'logOnServer',
                    label: 'Log on Server'
                }),
                switchInput({
                    bind: 'requireReload',
                    disabled: model.disabled,
                    label: 'Require Reload'
                })
            )
        });
    }
);