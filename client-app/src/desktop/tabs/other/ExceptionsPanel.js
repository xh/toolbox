import {wrapper} from '../../common';
import {hoistCmp, HoistModel} from '@xh/hoist/core';
import {box, filler, hbox, p} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './ExceptionsPanel.scss';
import {XH} from '@xh/hoist/core';
import {codeInput} from '@xh/hoist/desktop/cmp/input';
import {bindable, action} from '@xh/hoist/mobx';
import {creates} from '@xh/hoist/core/modelspec';

export const exceptionsPanel = hoistCmp.factory({
    model: creates(() => new Model()),
    render: ({model}) => wrapper({
        description: [
            p('Hoist\'s Exception Handler standardizes and facilitates catching exceptions and errors on server and client sides. When an exception is caught, the Exception Dialog component is able to present the error in a stringified, human-readable format and offer more details, like the HTTP status code, error message, and stack trace. Some errors may require an app refresh, while others do not. Errors can also be marked as routine and need not reveal further details to the user beyond the stringified error message.'),
            p('Users also have the option to send a message to support@xh.io to report additional information about the error.')
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
                        title: 'Exception Handling Example',
                        icon: Icon.warning(),
                        items: [
                            p('In the `fooBar` function below, the Exception Handler catches the error and returns the error message in a readable format. Since `bar` has not been defined, a Reference Error will be thrown.'),
                            codeInput({
                                width: 'fill',
                                height: 120,
                                showFullscreenButton: false,
                                editorProps: {
                                    readOnly: true
                                },
                                mode: 'javascript',
                                value: fooBar.toString()
                            }),
                            filler(),
                            button({
                                text: 'Run fooBar()',
                                className: 'xh-button',
                                minimal: false,
                                icon: Icon.warningCircle({className: 'xh-red'}),
                                onClick: () => {
                                    try {
                                        fooBar();
                                    } catch (e) {
                                        XH.handleException(e, {logOnServer: false});
                                    }
                                }
                            })]
                    }),
                    panel({
                        title: 'Server Unresponsive',
                        icon: Icon.warning(),
                        items: [
                            p('When the server is unresponsive, Hoist will throw an exception and require an app reload. By default, these errors are tracked in our admin logger and are reported in our monitoring activity.'),
                            codeInput({
                                bind: 'pingResponse',
                                height: 120,
                                showFullscreenButton: false,
                                editorProps: {
                                    readOnly: true
                                },
                                mode: {name: 'javascript', json: true}
                            }),
                            filler(),
                            hbox({
                                items: [
                                    button({
                                        text: 'Check Server',
                                        minimal: false,
                                        icon: Icon.checkCircle({className: 'xh-green'}),
                                        onClick: () => model.onPingClicked()
                                    }),
                                    button({
                                        text: 'Server Down',
                                        minimal: false,
                                        icon: Icon.skull({className: 'xh-red'}),
                                        onClick: () => XH.handleException('Server Unavailable', {
                                            name: 'Server Unavailable',
                                            message: `Unable to contact the server at ${window.location.origin}`,
                                            logOnServer: false,
                                            requireReload: true
                                        })
                                    })
                                ]
                            })
                        ]
                    }),
                    panel({
                        title: 'Promise Exceptions',
                        icon: Icon.warning(),
                        items: [
                            p('Hoist provides a neat .catchDefault() method that will handle exceptions and smart decode HTTP responses. (No need to wrap in try/catch logic!)'),
                            p('In this example, a call to the route \'/badRequest\' will throw a client-side error. The 404 error code is parsed by the exception handler and marks the error as routine, leaving out unnecessarily worrying or irrelevant details for the user.'),
                            filler(),
                            button({
                                text: 'Visit xh.io/badRequest',
                                className: 'xh-button',
                                minimal: false,
                                icon: Icon.warningCircle({className: 'xh-red'}),
                                onClick: () => XH.fetch({url: 'badRequest'}).catchDefault()
                            })
                        ]
                    })
                ]
            })
        ]
    })
});


function fooBar() {
    const foo = 'foo';
    return foo + bar;
}

@HoistModel
class Model {
    @bindable
    pingResponse = '/*\nPing or kill the Toolbox server\nby clicking one of the buttons \nbelow.\n*/';

    @action
    setPing(ping) {
        this.pingResponse = ping;
    }

    async onPingClicked() {
        const pingURL = XH.isDevelopmentMode ?
            `${XH.baseUrl}ping` :
            `${window.location.origin}${XH.baseUrl}ping`;
        await XH.fetchJson({url: pingURL}).then(
            (res) => this.setPing(JSON.stringify(res, null, '  '))
        );
    }
}