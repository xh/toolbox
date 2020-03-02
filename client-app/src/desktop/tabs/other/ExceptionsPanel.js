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
            p('Hoist\'s Exception Handler can render an Exception Dialog that presents the error in a readable format and offer more details, like the http status code, error message, and stack trace.'),
            p('Users also have the option to send a message to support@xh.io to report additional information about the error.')
        ],
        links: [
            {url: '$HR/core/ExceptionHandler.js', notes: 'Exception Handler'},
            {url: '$HR/exception/Exception.js', notes: 'Exceptions'}
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
                                model: model,
                                bind: 'pingResponse',
                                height: 120,
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
                            p('Instead of wrapping fetch requests in try/catch blocks, Hoist provides a .catchDefault() method that will handle exceptions and smart decode HTTP responses.'),
                            p('In the call to route \'/badRequest\', the 404 error code is parsed by the exception handler and does not provide a detailed stack trace because it is marked as a routine client-side error.'),
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